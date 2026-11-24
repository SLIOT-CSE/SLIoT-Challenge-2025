// Small outside checks: YouTube oEmbed for prototype links, Cloudflare Turnstile for registration.

type Fetch = typeof fetch;

/**
 * True when the video exists and is public or unlisted. oEmbed answers 401/403 for private
 * videos and 404 (or 400) for ones that don't exist. Anything else is YouTube having trouble,
 * which throws so the caller can decide.
 */
export async function youtubeVideoExists(videoId: string, fetcher: Fetch = fetch): Promise<boolean> {
  const url = `https://www.youtube.com/oembed?${new URLSearchParams({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    format: "json",
  })}`;
  const response = await fetcher(url, { signal: AbortSignal.timeout(5000) });
  if (response.ok) return true;
  if ([400, 401, 403, 404].includes(response.status)) return false;
  throw new Error(`YouTube oEmbed answered ${response.status}`);
}

/** True when Cloudflare accepts the Turnstile token */
export async function verifyTurnstileToken(
  secretKey: string,
  token: string | undefined,
  ip: string | null,
  fetcher: Fetch = fetch,
): Promise<boolean> {
  if (!token) return false;
  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile check failed", error);
    return false;
  }
}
