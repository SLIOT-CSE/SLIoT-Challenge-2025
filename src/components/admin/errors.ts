import { NetworkError } from "@/lib/data";

export const NETWORK_TEXT = "We couldn't reach the server. Check your connection and try again.";

/** A data call threw: the words to show. Only a network failure is expected; anything else is logged */
export function errorText(e: unknown): string {
  if (e instanceof NetworkError) return NETWORK_TEXT;
  console.error(e);
  return "Something went wrong. Try again.";
}
