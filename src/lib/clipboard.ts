/**
 * Robust client-side clipboard helper for CodePackr tools.
 * Uses the modern Clipboard API when available, with a textarea +
 * document.execCommand('copy') fallback for older browsers and
 * restricted contexts (e.g. some InPrivate / permission prompts).
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof text !== 'string' || text.length === 0) {
    return false;
  }

  // Preferred path
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }

  // Legacy fallback (works for multi-line content, including Markdown)
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);

    const selection = document.getSelection();
    const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(ta);

    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }

    return ok;
  } catch {
    return false;
  }
}
