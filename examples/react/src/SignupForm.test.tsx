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
          // Le formulaire ne doit jamais avoir d'erreur JS
          (container) => !container.querySelector(".error-boundary"),

          // Les champs required doivent toujours être marqués
          (container) => {
            const required = container.querySelectorAll("[required]");
            return Array.from(required).every((el) =>
              el.hasAttribute("aria-required")
            );
          },

          // Pas plus d'une modale ouverte
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
