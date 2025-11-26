import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { type UserInteraction } from "./types";
import { escapeUserEventText } from "./utils";

// Function to execute an interaction
export async function executeInteraction(
  container: HTMLElement,
  interaction: UserInteraction,
  user: ReturnType<typeof userEvent.setup> = userEvent.setup()
): Promise<void> {
  try {
    switch (interaction.type) {
      case "click": {
        const elements = container.querySelectorAll(interaction.selector);
        const element =
          interaction.nth !== undefined
            ? elements[interaction.nth]
            : elements[0];

        if (element) {
          interaction.selectedElement = element.cloneNode(true) as Element;

          if (interaction.options) {
            // @ts-expect-error "click" actually accepts options
            await user.click(element as Element, interaction.options);
          } else {
            await user.click(element as Element);
          }
        }
        break;
      }

      case "type": {
        const element = container.querySelector(interaction.selector);
        if (element) {
          interaction.selectedElement = element;

          if (!interaction.options?.skipClick) {
            await user.click(element);
          }

          // Skip typing if text is empty (user-event can't handle empty strings)
          if (interaction.text !== "") {
            await user.type(
              element,
              escapeUserEventText(interaction.text),
              interaction.options
            );
          }
        }
        break;
      }

      case "keyboard": {
        interaction.selectedElement = document.activeElement ?? undefined;

        await user.keyboard(interaction.keys);
        break;
      }

      case "hover": {
        const element = container.querySelector(interaction.selector);
        if (element) {
          interaction.selectedElement = element;

          await user.hover(element);
        }
        break;
      }

      case "unhover": {
        const element = container.querySelector(interaction.selector);
        if (element) {
          interaction.selectedElement = element;

          await user.unhover(element);
        }
        break;
      }

      case "select": {
        const element = container.querySelector(
          interaction.selector
        ) as HTMLSelectElement;

        if (element) {
          interaction.selectedElement = element;

          // Use the predetermined option if provided, otherwise pick first available
          let optionToSelect = interaction.option;

          if (!optionToSelect) {
            const availableOptions = within(element)
              .getAllByRole<HTMLOptionElement>("option")
              .map((opt) => opt.value);

            // Guard against empty options
            if (availableOptions.length > 0) {
              optionToSelect = availableOptions[0];
            }
          }

          if (optionToSelect) {
            await user.selectOptions(element, optionToSelect);
          }
        }
        break;
      }

      case "upload": {
        const element = container.querySelector(
          interaction.selector
        ) as HTMLInputElement;
        if (element) {
          interaction.selectedElement = element;

          const files = interaction.files.map(
            (f) => new File([f.content], f.name, { type: f.type })
          );
          await user.upload(element, files);
        }
        break;
      }

      case "clear": {
        const element = container.querySelector(interaction.selector);
        if (element) {
          interaction.selectedElement = element;

          await user.clear(element);
        }
        break;
      }

      case "tab": {
        const times = interaction.times || 1;
        for (let i = 0; i < times; i++) {
          if (interaction.shift) {
            await user.tab({ shift: true });
          } else {
            await user.tab();
          }
        }
        break;
      }
    }
  } catch (error) {
    // Log but don't fail - the element may not exist
    console.debug(
      `Interaction failed: ${interaction.type} on ${
        (interaction as any).selector
      }`,
      error
    );
  }
}

// Helper function to execute a complete sequence
export async function executeInteractionSequence(
  container: HTMLElement,
  interactions: UserInteraction[],
  options?: {
    delayBetween?: number;
    user?: ReturnType<typeof userEvent.setup>;
  }
): Promise<void> {
  const user = options?.user || userEvent.setup();

  for (const interaction of interactions) {
    await executeInteraction(container, interaction, user);

    if (options?.delayBetween) {
      await new Promise((resolve) => setTimeout(resolve, options.delayBetween));
    }
  }
}
