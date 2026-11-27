import { connection } from "next/server";
import { deadlines as contentDeadlines, type Deadlines } from "@/content/deadlines";
import { getDb } from "./db/client";
import { readDeadlines } from "./settings";

/**
 * The key dates for the public page: the ones saved in /admin/settings over the content file's.
 * Read on each request, never during the build. If the database can't be read, the page still
 * loads with the content file's dates.
 */
export async function publicDeadlines(): Promise<Deadlines> {
  await connection();
  try {
    return readDeadlines(getDb());
  } catch (error) {
    console.error("Couldn't read the deadlines, showing the ones in src/content/deadlines.ts", error);
    return contentDeadlines;
  }
}
