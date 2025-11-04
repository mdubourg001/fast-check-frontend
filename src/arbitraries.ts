import * as fc from "fast-check";
import {
  type ClickInteraction,
  type TypeInteraction,
  type KeyboardInteraction,
  type HoverInteraction,
  type UnhoverInteraction,
  type SelectInteraction,
  type UploadInteraction,
  type ClearInteraction,
  type TabInteraction,
  type UserInteraction,
  type ClickArbitraryInput,
  type TypeArbitraryInput,
  type KeyboardArbitraryInput,
  type HoverArbitraryInput,
  type UnhoverArbitraryInput,
  type SelectArbitraryInput,
  type UploadArbitraryInput,
  type ClearArbitraryInput,
  type TabArbitraryInput,
} from "./types";
import { toArbitrary } from "./utils";

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
    // extremely long strings (>1000 chars)
    fc.string({ minLength: 1000, maxLength: 5000 }),
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
      "999999999999999999999",
      // zero-width characters
      "\u200B", // zero-width space
      "\u200C", // zero-width non-joiner
      "\u200D", // zero-width joiner
      "test\u200Bword", // zero-width space in middle
      "\u200B\u200C\u200D", // multiple zero-width chars
      // RTL/BiDi text
      "שלום", // Hebrew: Shalom (Hello)
      "مرحبا", // Arabic: Marhaba (Hello)
      "مرحبا بك في العالم", // Arabic: Welcome to the world
      "עברית ו-English", // Mixed Hebrew and English
      "العربية and English", // Mixed Arabic and English
      // complex emoji sequences
      "👨‍👩‍👧‍👦", // family emoji (man, woman, girl, boy)
      "🏳️‍🌈", // rainbow flag
      "👨‍💻", // man technologist
      "👩‍🔬", // woman scientist
      "🧑‍🤝‍🧑", // people holding hands
      "👨‍👨‍👧‍👦", // family with two fathers
      "🏴󠁧󠁢󠁥󠁮󠁧󠁿", // England flag
      // surrogate pairs and edge case Unicode
      "𝕳𝖊𝖑𝖑𝖔", // mathematical bold text (surrogate pairs)
      "𝓗𝓮𝓵𝓵𝓸", // mathematical script (surrogate pairs)
      "🤖🚀💻", // multiple emoji
      "\uD83D\uDE00", // grinning face emoji as surrogate pair
      "a\uD800", // unpaired high surrogate (invalid)
      "\uDC00b", // unpaired low surrogate (invalid)
      "𐐷𐐷𐐷", // Deseret capital letter EW (U+10437)
      "\u0000", // null character
      "\uFFFD", // replacement character
      "\uFEFF" // zero-width no-break space (BOM)
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

// ----- arbitraries for each interactions type -----

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
