import fc from "fast-check";
import { render } from "@testing-library/react";

import { createInteractionProperty } from "../../../src/";
import { SimpleInput, type SimpleInputProps } from "./SimpleInput";

describe("SimpleInput with random props", () => {
  it("maintains invariants with random props and interactions", async () => {
    await fc.assert(
      createInteractionProperty<SimpleInputProps>({
        // Generate random props for each test run
        // Use fc.chain to ensure initialValue respects maxLength
        propsArbitrary: fc.integer({ min: 5, max: 50 }).chain((maxLength) =>
          fc.record({
            maxLength: fc.constant(maxLength),
            initialValue: fc.string({ maxLength }),
            disabled: fc.boolean(),
            placeholder: fc.constantFrom(
              "Type here...",
              "Enter text",
              "",
              "Test input"
            ),
          })
        ),

        // Setup receives the generated props
        setup: (props) => render(<SimpleInput {...props} />).container,

        // Invariants verify component behavior with those props
        invariants: [
          // Component should never crash
          (container) => !container.querySelector(".error-boundary"),

          // Input value should never exceed maxLength
          (container, interactions, props) => {
            const input = container.querySelector(
              'input[data-testid="simple-input"]'
            ) as HTMLInputElement;

            if (!input) return true;
            return input.value.length <= props.maxLength;
          },

          // Disabled prop should be respected
          (container, interactions, props) => {
            const input = container.querySelector(
              'input[data-testid="simple-input"]'
            ) as HTMLInputElement;

            if (!input) return true;

            if (props.disabled) {
              return input.disabled === true;
            }

            return true;
          },

          // Character count should match actual length
          (container) => {
            const input = container.querySelector(
              'input[data-testid="simple-input"]'
            ) as HTMLInputElement;
            const charCount = container.querySelector(
              '[data-testid="char-count"]'
            );

            if (!input || !charCount) return true;

            const displayedCount = parseInt(
              charCount.textContent?.split("/")[0].trim() || "0"
            );
            return displayedCount === input.value.length;
          },

          // Placeholder should match prop
          (container, interactions, props) => {
            const input = container.querySelector(
              'input[data-testid="simple-input"]'
            ) as HTMLInputElement;

            if (!input) return true;
            return input.placeholder === props.placeholder;
          },
        ],
      }),
      { numRuns: 20 }
    );
  }, 60_000);
});
