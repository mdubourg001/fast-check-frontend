import * as fc from "fast-check";

// Helper to check if a value is a fast-check arbitrary
export function isArbitrary(value: any): value is fc.Arbitrary<any> {
  return value && typeof value.generate === "function";
}

// Helper to convert a value to an arbitrary
export function toArbitrary<T>(value: T | fc.Arbitrary<T>): fc.Arbitrary<T> {
  return isArbitrary(value) ? value : fc.constant(value);
}

// Helper function to escape special user-event characters
export function escapeUserEventText(text: string): string {
  return text
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}")
    .replace(/\[/g, "[[")
    .replace(/\]/g, "]]");
}
