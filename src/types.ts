import * as fc from "fast-check";

// Types for different interactions
export type ClickInteraction = {
  type: "click";
  selector: string;
  selectedElement?: Element;
  options?: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    button?: 0 | 1 | 2;
  };
  nth?: number; // If multiple elements match
};

export type TypeInteraction = {
  type: "type";
  selector: string;
  selectedElement?: Element;
  text: string;
  options?: {
    delay?: number;
    skipClick?: boolean;
    skipAutoClose?: boolean;
  };
};

export type KeyboardInteraction = {
  type: "keyboard";
  keys: string;
  selectedElement?: Element;
};

export type HoverInteraction = {
  type: "hover";
  selector: string;
  selectedElement?: Element;
};

export type UnhoverInteraction = {
  type: "unhover";
  selector: string;
  selectedElement?: Element;
};

export type SelectInteraction = {
  type: "select";
  selector: string;
  selectedElement?: Element;
  option?: string; // Specific option value to select
};

export type UploadInteraction = {
  type: "upload";
  selector: string;
  selectedElement?: Element;
  files: Array<{ name: string; content: string; type: string }>;
};

export type ClearInteraction = {
  type: "clear";
  selector: string;
  selectedElement?: Element;
};

export type TabInteraction = {
  type: "tab";
  shift?: boolean;
  times?: number;
};

export type UserInteraction =
  | ClickInteraction
  | TypeInteraction
  | KeyboardInteraction
  | HoverInteraction
  | UnhoverInteraction
  | SelectInteraction
  | UploadInteraction
  | ClearInteraction
  | TabInteraction;

// Input types for arbitraries
export type ClickArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  options?:
    | ClickInteraction["options"]
    | fc.Arbitrary<ClickInteraction["options"]>;
  nth?: number | fc.Arbitrary<number | undefined>;
};

export type TypeArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  text?: string | fc.Arbitrary<string>;
  options?:
    | TypeInteraction["options"]
    | fc.Arbitrary<TypeInteraction["options"]>;
};

export type KeyboardArbitraryInput = {
  keys?: string | fc.Arbitrary<string>;
};

export type HoverArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
};

export type UnhoverArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
};

export type SelectArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  option?: string | fc.Arbitrary<string | undefined>;
};

export type UploadArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
  files?: UploadInteraction["files"] | fc.Arbitrary<UploadInteraction["files"]>;
};

export type ClearArbitraryInput = {
  selector?: string | fc.Arbitrary<string>;
};

export type TabArbitraryInput = {
  shift?: boolean | fc.Arbitrary<boolean>;
  times?: number | fc.Arbitrary<number>;
};
