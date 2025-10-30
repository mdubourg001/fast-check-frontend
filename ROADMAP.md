# Roadmap

## Recently Completed ✓

- [x] Fix error construction bug (issue #1)
- [x] Fix non-deterministic selection in select interaction (issue #2)
- [x] Add guards for empty options array (issue #3)

---

## Critical: Pre-1.0 Blockers

### Type Safety

- [ ] Remove `@ts-expect-error` hack on line 460 for click options
- [ ] Remove unsafe type cast `(interaction as any).selector` on line 578
- [ ] Add proper type narrowing for interaction selectors

---

## High Priority: Architecture

### Code Organization

- [ ] Split 655-line file into modules:
  - [ ] `types.ts` - Type definitions
  - [ ] `arbitraries.ts` - Arbitrary generators
  - [ ] `execution.ts` - Interaction execution
  - [ ] `property.ts` - Property creation
  - [ ] `utils.ts` - Helper functions

### Extensibility

- [ ] Design plugin/extension system for custom interaction types
- [ ] Add support for custom interaction executors
- [ ] Abstract away Testing Library dependency (support Playwright/Cypress/Puppeteer)

---

## High Priority: Edge Cases & Coverage

### Text Arbitrary Improvements

- [ ] Add extremely long strings (>1000 chars)
- [ ] Add zero-width characters (`\u200B`, `\u200C`, `\u200D`)
- [ ] Add RTL/BiDi text (Hebrew, Arabic)
- [ ] Add complex emoji sequences (👨‍👩‍👧‍👦, 🏳️‍🌈)
- [ ] Add surrogate pairs and edge case Unicode

### Missing Interaction Types

- [ ] Multi-select interaction (Ctrl+click, Shift+click)
- [ ] Drag-and-drop interaction
- [ ] Context menu (right-click) interaction
- [ ] Scroll interaction
- [ ] Focus trap testing
- [ ] Clipboard operations (copy/paste)
- [ ] Touch events (for mobile testing)
- [ ] Double-click interaction
- [ ] Mouse wheel events

---

## Medium Priority: API Design

### Lifecycle Management

- [ ] Add cleanup hook to `createInteractionProperty` options
- [ ] Allow custom cleanup logic beyond `container.remove()`
- [ ] Add `beforeEach` / `afterEach` hooks for interactions

### Configuration

- [ ] Add global config for default `userEvent.setup()` options
- [ ] Allow per-test userEvent configuration
- [ ] Add debug mode with detailed logging

### Interaction Hooks

- [ ] Add `beforeInteraction` hook for logging/debugging
- [ ] Add `afterInteraction` hook for assertions/snapshots
- [ ] Add `onInteractionError` hook for custom error handling

### Advanced Features

- [ ] Add conditional interaction execution (skip based on DOM state)
- [ ] Add interaction preconditions (only execute if selector exists)
- [ ] Add interaction retry logic with configurable attempts

---

## Medium Priority: Code Quality

### Documentation

- [ ] Add JSDoc comments to all exported functions
- [ ] Add JSDoc comments to all types
- [ ] Document weight tuning guidelines
- [ ] Add API reference documentation
- [ ] Add "Getting Started" guide
- [ ] Add troubleshooting guide

### Testing

- [ ] Add unit tests for library itself
- [ ] Test each arbitrary in isolation
- [ ] Test interaction execution edge cases
- [ ] Add integration tests
- [ ] Add CI/CD pipeline

### Code Cleanup

- [ ] Remove debug `console.log` from ShoppingCart.test.tsx:36
- [ ] Review and document hardcoded interaction weights
- [ ] Add weight configuration to options
- [ ] Make Tab weight (13) configurable with explanation

---

## Low Priority: Performance

### Optimization

- [ ] Cache `querySelector` results during interaction sequence
- [ ] Add option for parallel interaction execution (where safe)
- [ ] Add timeout protection for long sequences
- [ ] Add performance benchmarks
- [ ] Profile and optimize hot paths

### Monitoring

- [ ] Add interaction timing metrics
- [ ] Add memory usage tracking
- [ ] Add test execution statistics

---

## Low Priority: Developer Experience

### Tooling

- [ ] Add shrinking hints for better error messages
- [ ] Add visual replay of failed interaction sequences
- [ ] Add interaction sequence recorder (generate tests from manual testing)
- [ ] Add VS Code extension for inline invariant suggestions

### Examples

- [ ] Add more example components (modal, dropdown, autocomplete)
- [ ] Add examples for different frameworks (Vue, Svelte, Angular)
- [ ] Add example of testing with Playwright
- [ ] Add real-world application example

---

## Future: Advanced Features

### Smart Generation

- [ ] Add stateful arbitraries (learn from DOM state)
- [ ] Add accessibility-aware interaction generation
- [ ] Add coverage-guided fuzzing (prioritize unexplored paths)
- [ ] Add mutation testing integration

### Integrations

- [ ] Storybook addon for property-based testing
- [ ] Playwright Test integration
- [ ] Cypress integration
- [ ] Browser DevTools extension

### Analysis

- [ ] Generate interaction heatmaps
- [ ] Detect flaky invariants
- [ ] Suggest missing invariants based on component structure
- [ ] Auto-generate accessibility invariants

---

## Notes

### Current Test Quality Scores

- **TodoList.test.tsx**: 9/10 - Excellent, 7 comprehensive invariants
- **SignupForm.test.tsx**: 6/10 - Only 3 invariants, needs more coverage
- **ShoppingCart.test.tsx**: 5/10 - Fragile coupling to execution details

### Suggested Priority Order

1. Fix type safety issues (blockers)
2. Add documentation (JSDoc)
3. Split into modules (maintainability)
4. Add library unit tests (confidence)
5. Expand interaction types (feature completeness)
6. Improve text arbitraries (better edge case coverage)
7. Add hooks and extensibility (power users)
8. Performance optimizations (as needed)
