import * as fc from "fast-check";

import { UserInteraction } from "./types";

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

export function formatInteraction(interaction: UserInteraction): string {
  const formatted: string[] = [interaction.type];

  if ("selector" in interaction) {
    formatted.push(`on '${interaction.selector}'`);
  } else {
    formatted.push(`on <no selector>`);
  }

  if ("text" in interaction && interaction.text !== undefined) {
    formatted.push(`(text='${interaction.text}')`);
  }

  if ("keys" in interaction && interaction.keys !== undefined) {
    formatted.push(`(keys='${interaction.keys}')`);
  }

  return formatted.join(" ");
}
