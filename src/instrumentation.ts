// Runs once when the Next.js server starts (not in the browser, not in edge code).
// Checks production configuration and starts the email worker (docs/architecture.md, section 7).

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startServer } = await import("./server/start");
  startServer();
}
