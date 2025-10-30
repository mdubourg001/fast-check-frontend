import * as fc from "fast-check";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

// Types for different interactions
export type ClickInteraction = {
  type: "click";
  selector: string;
  selectedElement?: Element;
  options?: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    button?: 0 | 1 | 2;
  };
  nth?: number; // If multiple elements match
};

export type TypeInteraction = {
  type: "type";
  selector: string;
  selectedElement?: Element;
  text: string;
  options?: {
    delay?: number;
    skipClick?: boolean;
    skipAutoClose?: boolean;
  };
};

export type KeyboardInteraction = {
  type: "keyboard";
  keys: string;
  selectedElement?: Element;
};

export type HoverInteraction = {
  type: "hover";
  selector: string;
  selectedElement?: Element;
};

export type UnhoverInteraction = {
  type: "unhover";
  selector: string;
  selectedElement?: Element;
};

export type SelectInteraction = {
  type: "select";
  selector: string;
  selectedElement?: Element;
  option?: string; // Specific option value to select
};

export type UploadInteraction = {
  type: "upload";
  selector: string;
  selectedElement?: Element;
  files: Array<{ name: string; content: string; type: string }>;
};

export type ClearInteraction = {
  type: "clear";
  selector: string;
  selectedElement?: Element;
};

export type TabInteraction = {
  type: "tab";
  shift?: boolean;
  times?: number;
};

export type UserInteraction =
  | ClickInteraction
  | TypeInteraction
  | KeyboardInteraction
  | HoverInteraction
  | UnhoverInteraction
  | SelectInteraction
  | UploadInteraction
  | ClearInteraction
  | TabInteraction;

const defaultSelectors = [
  // selectors by ARIA role
  '[role="button"]',
  '[role="link"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="checkbox"]',
  '[role="radio"]',

  // selectors by element type
  "button",
  "a",
  'input[type="text"]',
  'input[type="number"]',
  'input[type="email"]',
  'input[type="password"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  "select",
  "textarea",
];

// Arbitraries for common CSS selectors
const selectorArbitrary = (selectors?: string[]) => {
  if (selectors) {
    return fc.constantFrom(...selectors);
  } else {
    return fc.constantFrom(...defaultSelectors);
  }
};

// Arbitraries for different text types
const textContentArbitrary = () =>
  fc.oneof(
    // random normal strings
    fc.string({ minLength: 1, maxLength: 100 }),
    // email
    fc.emailAddress(),
    // numbers
    fc.integer({ min: -1000000, max: 1000000 }).map(String),
    // special characters and edge cases
    fc.constantFrom(
      "",
      " ",
      "  multiple  spaces  ",
      "éàçù", // accents
      "你好", // unicode
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      "null",
      "undefined",
      "\\n\\t\\r",
      "0",
      "-1",
      "999999999999999999999"
    )
  );

// arbitrary for special keyboard keys
const specialKeysArbitrary = fc.constantFrom(
  "{Enter}",
  "{Escape}",
  "{Backspace}",
  "{Delete}",
  "{ArrowUp}",
  "{ArrowDown}",
  "{ArrowLeft}",
  "{ArrowRight}",
  "{Home}",
  "{End}",
  "{PageUp}",
  "{PageDown}",
  "{Tab}",
  "{Shift>}A{/Shift}", // Shift + A
  "{Control>}a{/Control}", // Ctrl + A (select all)
  "{Control>}c{/Control}", // Ctrl + C
  "{Control>}v{/Control}", // Ctrl + V
  "{Control>}z{/Control}", // Ctrl + Z
  "{Meta>}a{/Meta}", // Cmd + A sur Mac
  "{Alt>}a{/Alt}" // Alt + A
);

// Helper to check if a value is a fast-check arbitrary
function isArbitrary(value: any): value is fc.Arbitrary<any> {
  return value && typeof value.generate === "function";
}

// Helper to convert a value to an arbitrary
function toArbitrary<T>(value: T | fc.Arbitrary<T>): fc.Arbitrary<T> {
  return isArbitrary(value) ? value : fc.constant(value);
}

// ----- arbitraries for each interactions type -----

type ClickArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  options?:
    | ClickInteraction["options"]
    | fc.Arbitrary<ClickInteraction["options"]>;
  nth?: number | fc.Arbitrary<number | undefined>;
};

export const clickArbitrary: (
  interaction?: ClickArbitraryInput
) => fc.Arbitrary<ClickInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("click" as const),
    selector:
      interaction.selector !== undefined
        ? toArbitrary(interaction.selector)
        : selectorArbitrary(),
    options:
      interaction.options !== undefined
        ? toArbitrary(interaction.options)
        : fc.option(
            fc.record({
              ctrlKey: fc.boolean(),
              shiftKey: fc.boolean(),
              altKey: fc.boolean(),
              button: fc.constantFrom(0, 1, 2) as fc.Arbitrary<0 | 1 | 2>,
            }),
            { nil: undefined }
          ),
    nth:
      interaction.nth !== undefined
        ? toArbitrary(interaction.nth)
        : fc.option(fc.integer({ min: 0, max: 10 }), { nil: undefined }),
  });

type TypeArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  text?: string | fc.Arbitrary<string>;
  options?:
    | TypeInteraction["options"]
    | fc.Arbitrary<TypeInteraction["options"]>;
};

export const typeArbitrary: (
  interaction?: TypeArbitraryInput
) => fc.Arbitrary<TypeInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("type" as const),
    selector:
      interaction.selector !== undefined
        ? toArbitrary(interaction.selector)
        : fc.oneof(
            fc.constant('input[type="text"]'),
            fc.constant('input[type="number"]'),
            fc.constant('input[type="email"]'),
            fc.constant('input[type="password"]'),
            fc.constant('input[type="search"]'),
            fc.constant('input[type="tel"]'),
            fc.constant('input[type="url"]'),
            fc.constant("textarea"),
            fc.constant('[contenteditable="true"]')
          ),
    text:
      interaction.text !== undefined
        ? toArbitrary(interaction.text)
        : textContentArbitrary(),
    options:
      interaction.options !== undefined
        ? toArbitrary(interaction.options)
        : fc.option(
            fc.record({
              delay: fc.integer({ min: 0, max: 100 }),
              skipClick: fc.boolean(),
              skipAutoClose: fc.boolean(),
            }),
            { nil: undefined }
          ),
  });

type KeyboardArbitraryInput = {
  keys?: string | fc.Arbitrary<string>;
};

export const keyboardArbitrary: (
  interaction?: KeyboardArbitraryInput
) => fc.Arbitrary<KeyboardInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("keyboard" as const),
    keys:
      interaction.keys !== undefined
        ? toArbitrary(interaction.keys)
        : specialKeysArbitrary,
  });

type HoverArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
};

export const hoverArbitrary: (
  interaction?: HoverArbitraryInput
) => fc.Arbitrary<HoverInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("hover" as const),
    selector:
      interaction.selector !== undefined
        ? toArbitrary(interaction.selector)
        : selectorArbitrary(),
  });

type UnhoverArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
};

export const unhoverArbitrary: (
  interaction?: UnhoverArbitraryInput
) => fc.Arbitrary<UnhoverInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("unhover" as const),
    selector:
      interaction.selector !== undefined
        ? toArbitrary(interaction.selector)
        : selectorArbitrary(),
  });

type SelectArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  option?: string | fc.Arbitrary<string | undefined>;
};

export const selectArbitrary: (
  interaction?: SelectArbitraryInput
) => fc.Arbitrary<SelectInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("select" as const),
    selector:
      interaction.selector !== undefined
        ? toArbitrary(interaction.selector)
        : fc.constant("select"),
    option:
      interaction.option !== undefined
        ? toArbitrary(interaction.option)
        : fc.constant(undefined),
  });

type UploadArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  files?: UploadInteraction["files"] | fc.Arbitrary<UploadInteraction["files"]>;
};

export const uploadArbitrary: (
  interaction?: UploadArbitraryInput
) => fc.Arbitrary<UploadInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("upload" as const),
    selector:
      interaction.selector !== undefined
        ? toArbitrary(interaction.selector)
        : fc.constant('input[type="file"]'),
    files:
      interaction.files !== undefined
        ? toArbitrary(interaction.files)
        : fc.array(
            fc.record({
              name: fc.constantFrom("test.txt", "image.png", "document.pdf"),
              content: fc.string({ minLength: 10, maxLength: 100 }),
              type: fc.constantFrom(
                "text/plain",
                "image/png",
                "application/pdf"
              ),
            }),
            { minLength: 1, maxLength: 3 }
          ),
  });

type ClearArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
};

export const clearArbitrary: (
  interaction?: ClearArbitraryInput
) => fc.Arbitrary<ClearInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("clear" as const),
    selector:
      interaction.selector !== undefined
        ? toArbitrary(interaction.selector)
        : fc.oneof(fc.constant("input"), fc.constant("textarea")),
  });

type TabArbitraryInput = {
  shift?: boolean | fc.Arbitrary<boolean>;
  times?: number | fc.Arbitrary<number>;
};

export const tabArbitrary: (
  interaction?: TabArbitraryInput
) => fc.Arbitrary<TabInteraction> = (interaction = {}) =>
  fc.record({
    type: fc.constant("tab" as const),
    shift:
      interaction.shift !== undefined
        ? toArbitrary(interaction.shift)
        : fc.boolean(),
    times:
      interaction.times !== undefined
        ? toArbitrary(interaction.times)
        : fc.integer({ min: 1, max: 5 }),
  });

// Main arbitrary that combines all interactions
export const defaultUserInteractionArbitrary = ({
  clickInteraction,
  typeInteraction,
  keyboardInteraction,
  hoverInteraction,
  unhoverInteraction,
  selectInteraction,
  uploadInteraction,
  clearInteraction,
  tabInteraction,
}: {
  clickInteraction?: ClickArbitraryInput;
  typeInteraction?: TypeArbitraryInput;
  keyboardInteraction?: KeyboardArbitraryInput;
  hoverInteraction?: HoverArbitraryInput;
  unhoverInteraction?: UnhoverArbitraryInput;
  selectInteraction?: SelectArbitraryInput;
  uploadInteraction?: UploadArbitraryInput;
  clearInteraction?: ClearArbitraryInput;
  tabInteraction?: TabArbitraryInput;
} = {}): fc.Arbitrary<UserInteraction> =>
  fc.oneof(
    { weight: 30, arbitrary: clickArbitrary(clickInteraction) }, // More clicks
    { weight: 25, arbitrary: typeArbitrary(typeInteraction) }, // Lots of typing
    { weight: 10, arbitrary: keyboardArbitrary(keyboardInteraction) }, // Keyboard actions
    { weight: 8, arbitrary: hoverArbitrary(hoverInteraction) }, // Hover
    { weight: 2, arbitrary: unhoverArbitrary(unhoverInteraction) }, // Unhover
    { weight: 5, arbitrary: selectArbitrary(selectInteraction) }, // List selection
    { weight: 2, arbitrary: uploadArbitrary(uploadInteraction) }, // File upload
    { weight: 5, arbitrary: clearArbitrary(clearInteraction) }, // Clear
    { weight: 13, arbitrary: tabArbitrary(tabInteraction) } // Keyboard navigation
  );

// Arbitrary for interaction sequences
export const interactionSequenceArbitrary = (
  minLength: number = 1,
  maxLength: number = 10,
  interactionsSequenceArbitrary = defaultUserInteractionArbitrary
): fc.Arbitrary<UserInteraction[]> =>
  fc.array(interactionsSequenceArbitrary(), { minLength, maxLength });

// Helper function to escape special user-event characters
function escapeUserEventText(text: string): string {
  return text
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}")
    .replace(/\[/g, "[[")
    .replace(/\]/g, "]]");
}

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
          interaction.selectedElement = element;

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

export function createInteractionProperty({
  setup,
  invariants,
  options = {
    sequenceMinLength: 1,
    sequenceMaxLength: 10,
    userInteractionArbitrary: defaultUserInteractionArbitrary,
  },
}: {
  setup: () => HTMLElement;
  invariants: Array<
    (
      container: HTMLElement,
      interactions: UserInteraction[]
    ) => boolean | Promise<boolean> | void | Promise<void>
  >;
  options?: {
    sequenceMinLength?: number;
    sequenceMaxLength?: number;
    userInteractionArbitrary?: () => fc.Arbitrary<UserInteraction>;
  };
}) {
  return fc.asyncProperty(
    interactionSequenceArbitrary(
      options?.sequenceMinLength,
      options?.sequenceMaxLength,
      options?.userInteractionArbitrary
    ),
    async (interactions) => {
      const container = setup();

      try {
        await executeInteractionSequence(container, interactions);

        for (const invariant of invariants) {
          const result = await invariant(container, interactions);

          if (typeof result === "boolean" && !result) {
            throw new Error("Invariant check failed after interaction sequence", { cause: interactions });
          }
        }

        return true;
      } finally {
        // Cleanup
        container.remove();
      }
    }
  );
}
