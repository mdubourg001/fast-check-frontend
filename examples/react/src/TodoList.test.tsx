import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as fc from "fast-check";
import { TodoList } from "./TodoList";
import {
  createInteractionProperty,
  clickArbitrary,
  typeArbitrary,
  keyboardArbitrary,
  tabArbitrary,
  type UserInteraction,
} from "../../../src/createInteractionProperty";

describe("TodoList - Property-Based Tests", () => {
  it("should maintain invariants under random user interactions", async () => {
    // Custom interaction arbitrary that targets TodoList-specific elements
    const todoListInteractionArbitrary = (): fc.Arbitrary<UserInteraction> =>
      fc.oneof(
        // Type into the todo input
        {
          weight: 4,
          arbitrary: typeArbitrary({ selector: '[data-testid="todo-input"]' }),
        },

        // Click the add button
        {
          weight: 3,
          arbitrary: clickArbitrary({
            selector: '[data-testid="add-todo-button"]',
          }),
        },

        // Click filter buttons
        {
          weight: 2,
          arbitrary: clickArbitrary({ selector: '[data-testid^="filter-"]' }),
        },

        // Click clear completed button (if it exists)
        {
          weight: 1,
          arbitrary: clickArbitrary({
            selector: '[data-testid="clear-completed"]',
          }),
        },

        // Click any checkbox (toggle completion)
        {
          weight: 3,
          arbitrary: clickArbitrary({
            selector: '[data-testid^="todo-checkbox-"]',
          }),
        },

        // Click any delete button
        {
          weight: 2,
          arbitrary: clickArbitrary({
            selector: '[data-testid^="todo-delete-"]',
          }),
        },

        // Press Enter key (to submit todo)
        { weight: 2, arbitrary: keyboardArbitrary({ keys: "{Enter}" }) },

        // Tab navigation
        { weight: 2, arbitrary: tabArbitrary() },

        // Click any button
        { weight: 1, arbitrary: clickArbitrary({ selector: "button" }) }
      );

    const property = createInteractionProperty({
      setup: () => {
        const { container } = render(<TodoList />);
        return container;
      },
      invariants: [
        // Invariant 1: Count consistency
        // completed count + active count should always equal total count
        (container) => {
          const counter = container.querySelector(
            '[data-testid="todo-counter"]'
          );
          if (!counter) return true;

          const total = parseInt(counter.getAttribute("data-total") || "0", 10);
          const active = parseInt(
            counter.getAttribute("data-active") || "0",
            10
          );
          const completed = parseInt(
            counter.getAttribute("data-completed") || "0",
            10
          );

          expect(
            active + completed,
            `Count consistency failed: active(${active}) + completed(${completed}) !== total(${total})`
          ).toBe(total);

          return true;
        },

        // Invariant 2: DOM consistency
        // Number of rendered todo items should match the total count (when filter is "all")
        (container) => {
          const counter = container.querySelector(
            '[data-testid="todo-counter"]'
          );
          const filterAll = container.querySelector(
            '[data-testid="filter-all"]'
          );

          if (!counter || !filterAll) return true;

          const isAllFilterActive =
            filterAll.getAttribute("aria-selected") === "true";

          if (isAllFilterActive) {
            const total = parseInt(
              counter.getAttribute("data-total") || "0",
              10
            );
            const todoItems = container.querySelectorAll(
              '[data-testid^="todo-item-"]'
            );
            const emptyState = container.querySelector(
              '[data-testid="empty-state"]'
            );

            if (total === 0) {
              expect(
                emptyState,
                "Empty state should be shown when there are no todos"
              ).not.toBeNull();
            } else {
              expect(
                todoItems.length,
                `DOM consistency failed: rendered items(${todoItems.length}) !== total(${total})`
              ).toBe(total);
            }
          }

          return true;
        },

        // Invariant 3: Filter logic
        // When filtered, only appropriate items should be visible
        (container) => {
          const filterActive = container.querySelector(
            '[data-testid="filter-active"]'
          );
          const filterCompleted = container.querySelector(
            '[data-testid="filter-completed"]'
          );
          const todoItems = container.querySelectorAll(
            '[data-testid^="todo-item-"]'
          );

          if (filterActive?.getAttribute("aria-selected") === "true") {
            // All visible items should NOT be completed
            todoItems.forEach((item) => {
              const isCompleted =
                item.getAttribute("data-completed") === "true";
              expect(
                isCompleted,
                "Active filter should only show non-completed items"
              ).toBe(false);
            });
          } else if (
            filterCompleted?.getAttribute("aria-selected") === "true"
          ) {
            // All visible items SHOULD be completed
            todoItems.forEach((item) => {
              const isCompleted =
                item.getAttribute("data-completed") === "true";
              expect(
                isCompleted,
                "Completed filter should only show completed items"
              ).toBe(true);
            });
          }

          return true;
        },

        // Invariant 4: No duplicate IDs
        // Each todo item should have a unique ID
        (container) => {
          const todoItems = container.querySelectorAll(
            '[data-testid^="todo-item-"]'
          );
          const ids = new Set<string>();

          todoItems.forEach((item) => {
            const testId = item.getAttribute("data-testid");
            if (testId) {
              const id = testId.replace("todo-item-", "");
              expect(ids.has(id), `Duplicate ID found: ${id}`).toBe(false);
              ids.add(id);
            }
          });

          return true;
        },

        // Invariant 5: Accessibility attributes
        // Checkboxes should always have proper aria-label
        (container) => {
          const checkboxes = container.querySelectorAll(
            '[data-testid^="todo-checkbox-"]'
          );

          checkboxes.forEach((checkbox) => {
            const ariaLabel = checkbox.getAttribute("aria-label");
            expect(ariaLabel, "Checkbox should have aria-label").toBeTruthy();
            expect(
              ariaLabel,
              "Checkbox aria-label should describe the action"
            ).toMatch(/Mark .* as (complete|incomplete)/);
          });

          return true;
        },

        // Invariant 6: Clear completed button visibility
        // Button should only appear when there are completed items
        (container) => {
          const counter = container.querySelector(
            '[data-testid="todo-counter"]'
          );
          const clearButton = container.querySelector(
            '[data-testid="clear-completed"]'
          );

          if (!counter) return true;

          const completedCount = parseInt(
            counter.getAttribute("data-completed") || "0",
            10
          );

          if (completedCount === 0) {
            expect(
              clearButton,
              "Clear completed button should not be visible when there are no completed items"
            ).toBeNull();
          } else {
            expect(
              clearButton,
              "Clear completed button should be visible when there are completed items"
            ).not.toBeNull();
          }

          return true;
        },

        // Invariant 7: No crashes
        // There should be no error boundary or uncaught errors
        (container) => {
          const errorBoundary = container.querySelector('[data-error="true"]');
          expect(
            errorBoundary,
            "No error boundary should be triggered"
          ).toBeNull();

          return true;
        },
      ],
      options: {
        sequenceMinLength: 5,
        sequenceMaxLength: 20,
        userInteractionArbitrary: todoListInteractionArbitrary,
      },
    });

    await fc.assert(property, {
      numRuns: 100, // Run 100 random test cases
    });
  }, 60_000);
});
