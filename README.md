# fast-check-frontend

**Note: This library is currently a work in progress and not yet ready for production use.**

Property-based testing for UI components. Generate random user interaction sequences and verify your components maintain their invariants.

## Overview

Traditional UI tests specify exact user flows: "click button A, type text B, verify outcome C". This approach misses edge cases created by unexpected interaction sequences.

**fast-check-frontend** takes a different approach inspired by property-based testing:

1. Define what should **always** be true about your component (invariants)
2. Generate hundreds of random interaction sequences (clicks, typing, keyboard shortcuts, etc.)
3. Execute each sequence and verify all invariants hold
4. When an invariant breaks, get the exact interaction sequence that caused the failure

The library combines [fast-check](https://github.com/dubzzz/fast-check) for property-based testing with [Testing Library](https://testing-library.com/) for realistic user interactions.

## Philosophy

Rather than testing what your component **should do**, test what it should **never do**:
- Never crash
- Never violate accessibility rules
- Never show multiple modals simultaneously
- Never lose required field indicators
- Never enter invalid states

This approach finds edge cases that manual test writing misses.

## Getting Started

### Installation

```bash
pnpm add -D fast-check-frontend fast-check @testing-library/user-event @testing-library/dom
```

### Basic Example

Here's a test for a signup form that verifies three invariants under random interactions:

```typescript
import fc from "fast-check";
import { render } from "@testing-library/react";
import { createInteractionProperty } from "fast-check-frontend";
import { SignupForm } from "./SignupForm";

it("maintains invariants under random interactions", async () => {
  await fc.assert(
    createInteractionProperty({
      // Setup: render a fresh component for each test
      setup: () => render(<SignupForm />).container,

      // Invariants: conditions that must always hold
      invariants: [
        // 1. Component should never crash
        (container) => !container.querySelector(".error-boundary"),

        // 2. Required fields must always be marked
        (container) => {
          const required = container.querySelectorAll("[required]");
          return Array.from(required).every((el) =>
            el.hasAttribute("aria-required")
          );
        },

        // 3. Only one modal open at a time
        (container) =>
          container.querySelectorAll('[role="dialog"]').length <= 1,
      ],
    })
  );
});
```

By default, this test will:
- Generate 100 random interaction sequences (fast-check default)
- Each sequence contains 1-10 interactions
- Interactions are weighted: clicks (30%), typing (25%), keyboard actions (10%), etc.
- Target common elements: buttons, inputs, textareas, select dropdowns
- Include edge case inputs: empty strings, Unicode, XSS attempts, SQL injection patterns

### Running Tests

```bash
pnpm test
```

The library works with any test runner that supports async tests (Vitest, Jest, etc.).

## Advanced Use Cases

### Custom Interaction Weights

Focus testing on specific interactions:

```typescript
import { clickArbitrary, typeArbitrary } from "fast-check-frontend";

createInteractionProperty({
  setup: () => render(<MyComponent />).container,
  invariants: [/* ... */],
  options: {
    userInteractionArbitrary: () =>
      fc.oneof(
        { weight: 70, arbitrary: clickArbitrary() },  // 70% clicks
        { weight: 30, arbitrary: typeArbitrary() }    // 30% typing
      ),
  },
});
```

### Custom Selectors

Target specific elements in your component:

```typescript
createInteractionProperty({
  setup: () => render(<MyForm />).container,
  invariants: [/* ... */],
  options: {
    userInteractionArbitrary: () =>
      fc.oneof(
        clickArbitrary({
          selector: fc.constantFrom(
            'button[type="submit"]',
            'button.cancel',
            'input[type="checkbox"]'
          )
        }),
        typeArbitrary({
          selector: fc.constantFrom(
            'input[name="email"]',
            'input[name="password"]'
          )
        })
      ),
  },
});
```

### Constrained Text Input

Control what text gets typed into fields:

```typescript
typeArbitrary({
  selector: fc.constant('input[name="email"]'),
  text: fc.emailAddress(),  // Only valid email addresses
})
```

### Sequence Length Configuration

Adjust how many interactions to generate per test:

```typescript
createInteractionProperty({
  setup: () => render(<MyComponent />).container,
  invariants: [/* ... */],
  options: {
    sequenceMinLength: 5,   // At least 5 interactions
    sequenceMaxLength: 20,  // At most 20 interactions
  },
});
```

### Accessing Interaction History

Debug failing tests by examining the exact sequence that broke an invariant:

```typescript
createInteractionProperty({
  setup: () => render(<MyComponent />).container,
  invariants: [
    (container, interactions) => {
      const isValid = container.querySelector(".success") !== null;

      if (!isValid) {
        // Log the failing sequence for debugging
        console.log("Failed after interactions:", interactions);
      }

      return isValid;
    },
  ],
});
```

Each interactions object will contain a `selectedElement` key that will contain a copy of the element targeted by the interaction **just before the interaction was executed on it**.

### Individual Interaction Arbitraries

Use individual interaction types for fine-grained control:

```typescript
import {
  clickArbitrary,
  typeArbitrary,
  keyboardArbitrary,
  hoverArbitrary,
  selectArbitrary,
  uploadArbitrary,
  clearArbitrary,
  tabArbitrary
} from "fast-check-frontend";

// Each arbitrary can be customized
const customClick = clickArbitrary({
  selector: fc.constant("button"),
  options: fc.constant({ ctrlKey: true }),  // Always Ctrl+Click
});

const customKeyboard = keyboardArbitrary({
  keys: fc.constantFrom("{Enter}", "{Escape}", "{Tab}"),
});
```

## How It Works

1. **Arbitraries**: fast-check arbitraries generate random interaction objects (clicks, typing, keyboard actions, etc.)
2. **Execution**: The library translates these objects into Testing Library user-event calls
3. **Graceful Handling**: If a selector doesn't match or an element doesn't exist, the interaction is skipped (logged but doesn't fail)
4. **Invariant Checking**: After each sequence, all invariants are checked. If any return `false` or throw, the test fails with the full interaction sequence

## When to Use This Library

**Good fits:**
- Complex components with many interaction paths
- Forms with intricate validation logic
- Components with state machines (modals, accordions, tabs)
- Accessibility compliance (verify ARIA attributes never break)
- Components where user errors should be handled gracefully

**Not ideal for:**
- Simple presentational components with no interactions
- Testing specific user flows (use regular Testing Library tests)
- Visual regression testing (use screenshot testing tools)

## License

MIT
