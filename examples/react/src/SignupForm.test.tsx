import fc from "fast-check";
import { render } from "@testing-library/react";

import { createInteractionProperty } from "../../../src/createInteractionProperty";
import { SignupForm } from "./SignupForm";

describe("SignupForm", () => {
  it("reste stable sous interactions aléatoires", async () => {
    await fc.assert(
      createInteractionProperty({
        renderComponent: () => render(<SignupForm />).container,
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
      }),
      { numRuns: 2 }
    );
  }, 60_000);
});
