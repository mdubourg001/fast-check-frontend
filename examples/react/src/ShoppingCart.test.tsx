import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { render, within } from "@testing-library/react";

import { createInteractionProperty } from "../../../src/createInteractionProperty";
import { ShoppingCart } from "./ShoppingCart";

describe("ShoppingCart", () => {
  test("cart quantity should always match 'add to cart' click count", async () => {
    await fc.assert(
      createInteractionProperty({
        setup: () => render(<ShoppingCart />).container,
        invariants: [
          (container, interactions) => {
            const cartQuantity = within(container).getByTestId("cart-quantity");
            const clickInteractionsOnCartButtons = interactions.filter(
              (interaction) =>
                interaction.type === "click" &&
                (
                  interaction.selectedElement as HTMLElement
                )?.dataset.testid?.startsWith("add-")
            );

            console.log({
              interactions,
              cartQuantity: cartQuantity.textContent,
              clickInteractionsOnCartButtons,
            });
            expect(cartQuantity.textContent).toBe(
              `${clickInteractionsOnCartButtons.length}`
            );
          },
        ],
      }),
      { numRuns: 100 }
    );
  }, 60_000);
});
