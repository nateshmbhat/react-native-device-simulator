/** How a text ended up outside the app. */
export type CopyResult = 'copied' | 'shared' | 'dismissed';

/** Copies text with the async Clipboard API, falling back to `execCommand`. */
export async function copyText(text: string): Promise<CopyResult> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    // Permission denied or insecure context: try the legacy path.
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('The browser blocked clipboard access.');
  return 'copied';
}
