import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { render, waitFor, within } from "@testing-library/react";

import {
  clickArbitrary,
  createInteractionProperty,
  keyboardArbitrary,
} from "../../../src/";
import { ShoppingCart } from "./ShoppingCart";

describe("ShoppingCart", () => {
  test("cart quantity should always match 'add to cart' click count", async () => {
    await fc.assert(
      createInteractionProperty({
        setup: () => render(<ShoppingCart />).container,
        invariants: [
          async (container, interactions) => {
            const cartQuantity = within(container).getByTestId("cart-quantity");
            const clickInteractionsOnCartButtons = interactions.filter(
              (interaction) =>
                interaction.type === "click" &&
                (
                  interaction.selectedElement as HTMLElement
                )?.dataset.testid?.startsWith("add-")
            );
            const keypressesOnCartButtons = interactions.filter(
              (interaction) =>
                interaction.type === "keyboard" &&
                (
                  interaction.selectedElement as HTMLElement
                )?.dataset.testid?.startsWith("add-") &&
                ["{Enter}", "{Space}"].includes(interaction.keys)
            );

            console.log({
              interactions,
              cartQuantity: cartQuantity.textContent,
              clickInteractionsOnCartButtons,
              keypressesOnCartButtons,
            });
            await waitFor(() =>
              expect(cartQuantity.textContent).toBe(
                `${
                  clickInteractionsOnCartButtons.length +
                  keypressesOnCartButtons.length
                }`
              )
            );
          },
        ],
        options: {
          userInteractionArbitrary: () =>
            fc.oneof(
              {
                weight: 1,
                arbitrary: clickArbitrary({
                  selector: 'button[data-testid^="add-"]',
                }),
              },
              {
                weight: 1,
                arbitrary: keyboardArbitrary({
                  keys: fc.oneof(
                    fc.constant("{Enter}"),
                    fc.constant("{Space}")
                  ),
                }),
              }
            ),
        },
      })
    );
  }, 60_000);
});
