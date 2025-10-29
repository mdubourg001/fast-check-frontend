import * as fc from "fast-check";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

// Types pour les différentes interactions
type ClickInteraction = {
  type: "click";
  selector: string;
  options?: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    button?: 0 | 1 | 2;
  };
  nth?: number; // Si plusieurs éléments matchent
};

type TypeInteraction = {
  type: "type";
  selector: string;
  text: string;
  options?: {
    delay?: number;
    skipClick?: boolean;
    skipAutoClose?: boolean;
  };
};

type KeyboardInteraction = {
  type: "keyboard";
  keys: string;
  selector?: string; // Optionnel, sinon sur l'élément actif
};

type HoverInteraction = {
  type: "hover";
  selector: string;
};

type UnhoverInteraction = {
  type: "unhover";
  selector: string;
};

type SelectInteraction = {
  type: "select";
  selector: string;
};

type UploadInteraction = {
  type: "upload";
  selector: string;
  files: Array<{ name: string; content: string; type: string }>;
};

type ClearInteraction = {
  type: "clear";
  selector: string;
};

type TabInteraction = {
  type: "tab";
  shift?: boolean;
  times?: number;
};

type UserInteraction =
  | ClickInteraction
  | TypeInteraction
  | KeyboardInteraction
  | HoverInteraction
  | UnhoverInteraction
  | SelectInteraction
  | UploadInteraction
  | ClearInteraction
  | TabInteraction;

// Arbitraires pour les sélecteurs CSS courants
const selectorArbitrary = fc.oneof(
  // Sélecteurs par attribut data-testid (recommandé)
  fc.constantFrom(
    '[data-testid="submit"]',
    '[data-testid="cancel"]',
    '[data-testid="input-email"]',
    '[data-testid="input-password"]'
  ),
  // Sélecteurs par rôle ARIA
  fc.constantFrom(
    '[role="button"]',
    '[role="link"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[role="checkbox"]',
    '[role="radio"]'
  ),
  // Sélecteurs par type d'élément
  fc.constantFrom(
    "button",
    "a",
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    "select",
    "textarea"
  )
);

// Arbitraires pour différents types de texte
const textContentArbitrary = fc.oneof(
  // Texte normal
  fc.string({ minLength: 1, maxLength: 100 }),
  // Email
  fc.emailAddress(),
  // Nombres
  fc.integer({ min: -1000000, max: 1000000 }).map(String),
  // Caractères spéciaux et edge cases
  fc.constantFrom(
    "",
    " ",
    "  multiple  spaces  ",
    "éàçù", // Caractères accentués
    "你好", // Unicode
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

// Arbitraire pour les séquences de touches spéciales
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

// Arbitraires pour chaque type d'interaction
const clickArbitrary: fc.Arbitrary<ClickInteraction> = fc.record({
  type: fc.constant("click" as const),
  selector: selectorArbitrary,
  options: fc.option(
    fc.record({
      ctrlKey: fc.boolean(),
      shiftKey: fc.boolean(),
      altKey: fc.boolean(),
      button: fc.constantFrom(0, 1, 2) as fc.Arbitrary<0 | 1 | 2>,
    }),
    { nil: undefined }
  ),
  nth: fc.option(fc.integer({ min: 0, max: 10 }), { nil: undefined }),
});

const typeArbitrary: fc.Arbitrary<TypeInteraction> = fc.record({
  type: fc.constant("type" as const),
  selector: fc.oneof(
    fc.constant('input[type="text"]'),
    fc.constant('input[type="email"]'),
    fc.constant('input[type="password"]'),
    fc.constant('input[type="search"]'),
    fc.constant('input[type="tel"]'),
    fc.constant('input[type="url"]'),
    fc.constant("textarea"),
    fc.constant('[contenteditable="true"]')
  ),
  text: textContentArbitrary,
  options: fc.option(
    fc.record({
      delay: fc.integer({ min: 0, max: 100 }),
      skipClick: fc.boolean(),
      skipAutoClose: fc.boolean(),
    }),
    { nil: undefined }
  ),
});

const keyboardArbitrary: fc.Arbitrary<KeyboardInteraction> = fc.record({
  type: fc.constant("keyboard" as const),
  keys: specialKeysArbitrary,
  selector: fc.option(selectorArbitrary, { nil: undefined }),
});

const hoverArbitrary: fc.Arbitrary<HoverInteraction> = fc.record({
  type: fc.constant("hover" as const),
  selector: selectorArbitrary,
});

const unhoverArbitrary: fc.Arbitrary<UnhoverInteraction> = fc.record({
  type: fc.constant("unhover" as const),
  selector: selectorArbitrary,
});

const selectArbitrary: fc.Arbitrary<SelectInteraction> = fc.record({
  type: fc.constant("select" as const),
  selector: fc.constant("select"),
});

const uploadArbitrary: fc.Arbitrary<UploadInteraction> = fc.record({
  type: fc.constant("upload" as const),
  selector: fc.constant('input[type="file"]'),
  files: fc.array(
    fc.record({
      name: fc.constantFrom("test.txt", "image.png", "document.pdf"),
      content: fc.string({ minLength: 10, maxLength: 100 }),
      type: fc.constantFrom("text/plain", "image/png", "application/pdf"),
    }),
    { minLength: 1, maxLength: 3 }
  ),
});

const clearArbitrary: fc.Arbitrary<ClearInteraction> = fc.record({
  type: fc.constant("clear" as const),
  selector: fc.oneof(fc.constant("input"), fc.constant("textarea")),
});

const tabArbitrary: fc.Arbitrary<TabInteraction> = fc.record({
  type: fc.constant("tab" as const),
  shift: fc.boolean(),
  times: fc.integer({ min: 1, max: 5 }),
});

// Arbitraire principal qui combine toutes les interactions
export const userInteractionArbitrary = (): fc.Arbitrary<UserInteraction> =>
  fc.oneof(
    { weight: 30, arbitrary: clickArbitrary }, // Plus de clics
    { weight: 25, arbitrary: typeArbitrary }, // Beaucoup de saisie
    { weight: 10, arbitrary: keyboardArbitrary }, // Actions clavier
    { weight: 8, arbitrary: hoverArbitrary }, // Survol
    { weight: 2, arbitrary: unhoverArbitrary }, // Fin de survol
    { weight: 5, arbitrary: selectArbitrary }, // Sélection dans liste
    { weight: 2, arbitrary: uploadArbitrary }, // Upload de fichiers
    { weight: 5, arbitrary: clearArbitrary }, // Effacement
    { weight: 13, arbitrary: tabArbitrary } // Navigation au clavier
  );

// Arbitraire pour des séquences d'interactions
export const interactionSequenceArbitrary = (
  minLength: number = 1,
  maxLength: number = 20
): fc.Arbitrary<UserInteraction[]> =>
  fc.array(userInteractionArbitrary(), { minLength, maxLength });

// Fonction pour exécuter une interaction
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
          if (interaction.options) {
            // Click avec modificateurs
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
          if (!interaction.options?.skipClick) {
            await user.click(element);
          }
          await user.type(element, interaction.text, interaction.options);
        }
        break;
      }

      case "keyboard": {
        if (interaction.selector) {
          const element = container.querySelector(interaction.selector);
          if (element) {
            await user.click(element);
          }
        }
        await user.keyboard(interaction.keys);
        break;
      }

      case "hover": {
        const element = container.querySelector(interaction.selector);
        if (element) {
          await user.hover(element);
        }
        break;
      }

      case "unhover": {
        const element = container.querySelector(interaction.selector);
        if (element) {
          await user.unhover(element);
        }
        break;
      }

      case "select": {
        const element = container.querySelector(
          interaction.selector
        ) as HTMLSelectElement;
        if (element) {
          const options =
            within(element).getAllByRole<HTMLOptionElement>("option");

          const randomOption = fc.sample(
            fc.constantFrom(...options.map((opt) => opt.value)),
            1
          )[0];

          await user.selectOptions(element, randomOption);
        }
        break;
      }

      case "upload": {
        const element = container.querySelector(
          interaction.selector
        ) as HTMLInputElement;
        if (element) {
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
    // Log mais ne pas faire échouer - l'élément n'existe peut-être pas
    console.debug(
      `Interaction failed: ${interaction.type} on ${
        (interaction as any).selector
      }`,
      error
    );
  }
}

// Fonction helper pour exécuter une séquence complète
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
  renderComponent,
  invariants,
  options = {
    sequenceMinLength: 1,
    sequenceMaxLength: 10,
  },
}: {
  renderComponent: () => HTMLElement;
  invariants: Array<(container: HTMLElement) => boolean | Promise<boolean>>;
  options?: {
    sequenceMinLength?: number;
    sequenceMaxLength?: number;
  };
}) {
  return fc.asyncProperty(
    interactionSequenceArbitrary(
      options?.sequenceMinLength,
      options?.sequenceMaxLength
    ),
    async (interactions) => {
      console.debug({ interactions });

      const container = renderComponent();

      try {
        await executeInteractionSequence(container, interactions);

        // Vérifier tous les invariants
        for (const invariant of invariants) {
          const result = await invariant(container);

          if (!result) {
            throw new Error("Failed interactions:", { cause: interactions });
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
