import * as fc from "fast-check";
import { type UserInteraction } from "./types";
import {
  defaultUserInteractionArbitrary,
  interactionSequenceArbitrary,
} from "./arbitraries";
import { executeInteractionSequence } from "./execution";

export function createInteractionProperty({
  setup,
  invariants,
  options = {
    sequenceMinLength: 1,
    sequenceMaxLength: 10,
    userInteractionArbitrary: defaultUserInteractionArbitrary,
  },
}: {
  setup: () => HTMLElement | Promise<HTMLElement>;
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
      const container = await setup();

      try {
        await executeInteractionSequence(container, interactions);

        for (const invariant of invariants) {
          const result = await invariant(container, interactions);

          if (typeof result === "boolean" && !result) {
            throw new Error(
              "Invariant check failed after interaction sequence",
              { cause: interactions }
            );
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
