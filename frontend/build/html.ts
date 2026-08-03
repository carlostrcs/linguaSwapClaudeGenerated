// Tiny HTML helpers for the build-time page generator.
//
// Every value interpolated into generated markup goes through `escapeHtml` or `attr` — there is no
// other place data is concatenated into HTML, which is what keeps the escaping auditable.

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/** `name="escaped value"`, or '' when the value is undefined. */
export function attr(name: string, value: string | undefined): string {
  return value === undefined ? '' : `${name}="${escapeHtml(value)}"`;
}

/** Join attribute fragments, dropping empties, with a leading space when non-empty. */
export function attrs(...parts: string[]): string {
  const joined = parts.filter(Boolean).join(' ');
  return joined ? ` ${joined}` : '';
}

/**
 * JSON-LD payload, safe to drop inside `<script type="application/ld+json">`.
 * `<` is escaped so a `</script>` inside any string cannot close the block early.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data, null, 0).replace(/</g, '\\u003c');
}

export function indent(lines: string[], depth = 0): string {
  const pad = '  '.repeat(depth);
  return lines.filter(Boolean).map((l) => `${pad}${l}`).join('\n');
}
