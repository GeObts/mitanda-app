// SHA-256 hex of a string, using Web Crypto — available identically in the
// browser and in Node 22 (globalThis.crypto.subtle). Used to bind an uploaded
// avatar image to the ownership signature so a captured signature can't be
// replayed to set a different image. Client and server MUST hash the exact same
// bytes (the data URL string).
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
