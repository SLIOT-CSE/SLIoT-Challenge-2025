/**
 * Thrown when a call can't reach the server. Different from a `Result` error: those are
 * answers from the server ("that email is taken"); this means no answer came at all.
 * Screens catch it separately and keep what the person typed.
 */
export class NetworkError extends Error {
  constructor(message = "We couldn't reach the server.") {
    super(message);
    this.name = "NetworkError";
  }
}
