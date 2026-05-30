import type { ProfileForm } from "../types";

const HASH_PREFIX = "#p=";

/** Encode form state into a URL-safe base64 string (browser-only). */
export function encodeFormToHash(form: ProfileForm): string {
  const json = JSON.stringify(form);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return HASH_PREFIX + b64;
}

export function decodeFormFromHash(hash: string): ProfileForm | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  let b64 = hash.slice(HASH_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  try {
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as ProfileForm;
  } catch {
    return null;
  }
}

/** Update the URL hash without scrolling or adding a history entry. */
export function writeHash(form: ProfileForm): void {
  const hash = encodeFormToHash(form);
  if (window.location.hash === hash) return;
  window.history.replaceState(null, "", window.location.pathname + window.location.search + hash);
}

export function readHash(): ProfileForm | null {
  return decodeFormFromHash(window.location.hash);
}

export function fullShareUrl(form: ProfileForm): string {
  return (
    window.location.origin +
    window.location.pathname +
    window.location.search +
    encodeFormToHash(form)
  );
}
