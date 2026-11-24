import type { FormValues } from "./form";

/** What the shell hands every step */
export interface StepProps {
  values: FormValues;
  /** The message to show for a field now, or undefined (errors wait for blur or a Next attempt) */
  error: (path: string) => string | undefined;
  /** Marks a field as visited, so its error may show */
  touch: (path: string) => void;
  /** Changes the values, and forgets any server error on the fields named */
  update: (change: (values: FormValues) => FormValues, clearPaths?: string[]) => void;
}
