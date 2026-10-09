/**
 * Password gate of a private docs site, as a Vercel Routing Middleware. Vercel runs it before it
 * serves any file (pages, search index, `llms.txt`, assets).
 *
 * Why: Blume builds a static site with no sign-in. HTTP Basic auth over HTTPS keeps the docs
 * private on any plan, and the browser remembers the password for the session.
 *
 * How: the request must carry `Authorization: Basic <base64(user:password)>` that matches
 * `DOCS_USERNAME` (default below) and `DOCS_PASSWORD`. Both sides are compared in constant time
 * over equal-length digests. Without `DOCS_PASSWORD` the gate refuses every request (503), so a
 * missing setting never opens the site.
 *
 * Set REALM and DEFAULT_USERNAME for the repo. This file has no imports, so it works in any repo
 * layout; in a monorepo you can move it into one shared package and re-export it from each site.
 *
 * @see https://vercel.com/docs/routing-middleware
 * @see https://datatracker.ietf.org/doc/html/rfc7617 (Basic authentication, UTF-8 charset)
 */

/** The text the browser shows in its password prompt. */
const REALM = "<Product> internal docs";

const DEFAULT_USERNAME = "<product>";

const encoder = new TextEncoder();

/** SHA-256 of `text`, so two values of any length compare as 32 bytes each. */
async function digest(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

/** True when both texts are equal. The time depends only on the digest length. */
async function sameText(a: string, b: string): Promise<boolean> {
  const [left, right] = await Promise.all([digest(a), digest(b)]);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

/**
 * The user and password of a Basic `Authorization` header, or `null` when the header is missing
 * or malformed. The password keeps every `:` after the first one (RFC 7617), and the bytes are
 * read as UTF-8.
 */
export function basicCredentials(
  header: string | null,
): { readonly username: string; readonly password: string } | null {
  const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})\s*$/i.exec(header ?? "");
  const encoded = match?.[1];
  if (encoded === undefined) {
    return null;
  }
  let decoded: string;
  try {
    const binary = atob(encoded);
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
  } catch {
    return null;
  }
  const separator = decoded.indexOf(":");
  if (separator < 0) {
    return null;
  }
  return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
}

const challenge = () =>
  new Response("Sign in to read the internal docs.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });

/**
 * The gate's answer for one request: `undefined` lets the host serve the file; a `Response` ends
 * the request (401 asks for the password, 503 means the site has no password set).
 */
export async function checkDocsAccess(
  request: Request,
  settings: { readonly username: string; readonly password: string | undefined },
): Promise<Response | undefined> {
  if (!settings.password) {
    return new Response("This docs site has no password set (DOCS_PASSWORD).", {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  }
  const given = basicCredentials(request.headers.get("authorization"));
  if (!given) {
    return challenge();
  }
  // Both checks always run, so a right username with a wrong password answers in the same time.
  const [userMatches, passwordMatches] = await Promise.all([
    sameText(given.username, settings.username),
    sameText(given.password, settings.password),
  ]);
  return userMatches && passwordMatches ? undefined : challenge();
}

/** The Routing Middleware entry, with the account from the project settings. */
export default function middleware(request: Request): Promise<Response | undefined> {
  return checkDocsAccess(request, {
    username: process.env["DOCS_USERNAME"]?.trim() || DEFAULT_USERNAME,
    password: process.env["DOCS_PASSWORD"],
  });
}
