import * as fc from "fast-check";

import { type UserInteraction, type InvariantFn, type SetupFn } from "./types";
import {
  defaultUserInteractionArbitrary,
  interactionSequenceArbitrary,
} from "./arbitraries";
import { executeInteractionSequence } from "./execution";

// Overload: without props
export function createInteractionProperty(config: {
  setup: SetupFn<void>;
  invariants: Array<InvariantFn<void>>;
  options?: {
    sequenceMinLength?: number;
    sequenceMaxLength?: number;
    userInteractionArbitrary?: () => fc.Arbitrary<UserInteraction>;
  };
}): fc.IAsyncProperty<[UserInteraction[]]>;

// Overload: with props
export function createInteractionProperty<Props>(config: {
  propsArbitrary?: fc.Arbitrary<Props>;
  setup: SetupFn<Props>;
  invariants: Array<InvariantFn<Props>>;
  options?: {
    sequenceMinLength?: number;
    sequenceMaxLength?: number;
    userInteractionArbitrary?: () => fc.Arbitrary<UserInteraction>;
  };
}): fc.IAsyncProperty<[Props, UserInteraction[]]>;

// Implementation
export function createInteractionProperty<Props = void>({
  propsArbitrary,
  setup,
  invariants,
  options = {
    sequenceMinLength: 1,
    sequenceMaxLength: 10,
    userInteractionArbitrary: defaultUserInteractionArbitrary,
  },
}: {
  propsArbitrary?: fc.Arbitrary<Props>;
  setup: SetupFn<Props>;
  invariants: Array<InvariantFn<Props>>;
  options?: {
    sequenceMinLength?: number;
    sequenceMaxLength?: number;
    userInteractionArbitrary?: () => fc.Arbitrary<UserInteraction>;
  };
}) {
  const interactionArb = interactionSequenceArbitrary(
    options?.sequenceMinLength,
    options?.sequenceMaxLength,
    options?.userInteractionArbitrary
  );

  // With props: generate both props and interactions
  if (propsArbitrary) {
    return fc.asyncProperty(
      fc.tuple(propsArbitrary, interactionArb),
      async ([props, interactions]) => {
        const container = await (setup as SetupFn<Props>)(props);

        try {
          await executeInteractionSequence(container, interactions);

          for (const invariant of invariants) {
            const result = await (invariant as InvariantFn<Props>)(
              container,
              interactions,
              props
            );

            if (typeof result === "boolean" && !result) {
              throw new Error(
                "Invariant check failed after interaction sequence",
                { cause: { props, interactions } }
              );
            }
          }

          return true;
        } finally {
          container.remove();
        }
      }
    );
  }

  // Without props: only generate interactions
  return fc.asyncProperty(interactionArb, async (interactions) => {
    const container = await (setup as SetupFn<void>)();

    try {
      await executeInteractionSequence(container, interactions);

      for (const invariant of invariants) {
        const result = await (invariant as InvariantFn<void>)(
          container,
          interactions
        );

        if (typeof result === "boolean" && !result) {
          throw new Error("Invariant check failed after interaction sequence", {
            cause: interactions,
          });
        }
      }

      return true;
    } finally {
      container.remove();
    }
  });
}
