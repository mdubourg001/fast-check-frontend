import fc from "fast-check";
import { render } from "@testing-library/react";

import {
  clickArbitrary,
  createInteractionProperty,
  typeArbitrary,
} from "../../../src/createInteractionProperty";
import { SignupForm } from "./SignupForm";

describe("SignupForm", () => {
  it("reste stable sous interactions aléatoires", async () => {
    await fc.assert(
      createInteractionProperty({
        setup: () => render(<SignupForm />).container,
        invariants: [
          // form should not crash
          (container) => !container.querySelector(".error-boundary"),

          // required fields must always be marked
          (container) => {
            const required = container.querySelectorAll("[required]");
            return Array.from(required).every((el) =>
              el.hasAttribute("aria-required")
            );
          },

          // only one open dialog at a time
          (container) =>
            container.querySelectorAll('[role="dialog"]').length <= 1,
        ],
        options: {
          userInteractionArbitrary: () =>
            fc.oneof(
              {
                weight: 50,
                arbitrary: clickArbitrary({
                  selector: fc.constantFrom(
                    'button[type="submit"]',
                    'input[type="checkbox"][name="terms"]',
                    "a.open-terms-link"
                  ),
                }),
              },
              {
                weight: 10,
                arbitrary: typeArbitrary(),
              }
            ),
        },
      }),
      { numRuns: 10 }
    );
  }, 60_000);
});
