// Turns the Vite-built `dist/index.html` into the two page shells the generator emits from.
//
// Reading the BUILT shell (rather than the source `index.html`) is the whole point: it already
// carries the hashed `/assets/index-*.js` and `/assets/index-*.css` tags, so generated pages
// reference the real build output without the generator having to know the hashes.

export interface Shell {
  /** `<head>` contents minus the hand-written title/description and minus the SPA script tags. */
  headBase: string;
  /** The SPA `<script type="module">` tags (plus any modulepreload links). */
  scripts: string;
}

const ROOT_DIV = '<div id="root"></div>';

/**
 * Split the built shell.
 *
 * Throws rather than degrading: if the anchor moved, every generated page would silently lose its
 * content or its scripts, which is far worse than a failed build.
 */
export function parseShell(html: string): Shell {
  if (!html.includes(ROOT_DIV)) {
    throw new Error(
      `dist/index.html no longer contains ${ROOT_DIV} — the injection anchor moved. ` +
        'Update build/shell.ts to match index.html.',
    );
  }

  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
  if (!headMatch) throw new Error('dist/index.html has no <head>');

  let head = headMatch[1];

  // Drop the source defaults — every generated page supplies its own, and leaving these in would
  // give each page two titles and two descriptions.
  head = head.replace(/<title>[\s\S]*?<\/title>/g, '');
  head = head.replace(/<meta\b[^>]*\bname="description"[^>]*>/g, '');

  const scriptTags: string[] = [];
  head = head.replace(/<script\b[^>]*\btype="module"[^>]*><\/script>/g, (tag) => {
    scriptTags.push(tag);
    return '';
  });
  head = head.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, (tag) => {
    scriptTags.push(tag);
    return '';
  });

  const headBase = head
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `    ${line}`)
    .join('\n');

  if (scriptTags.length === 0) {
    throw new Error('dist/index.html has no <script type="module"> — the SPA would never boot.');
  }

  return { headBase, scripts: scriptTags.map((t) => `    ${t}`).join('\n') };
}

export interface PageOptions {
  shell: Shell;
  /** Value for `<html lang>`. */
  lang: string;
  /** The per-route `<head>` block from `buildHead`. */
  head: string;
  /** Body markup. */
  body: string;
  /**
   * App pages keep the SPA scripts and render into `<div id="root">`; React's `createRoot().render()`
   * clears that container on mount, so any prerendered markup inside is replaced rather than
   * hydrated — no reconciliation, no mismatch warnings.
   *
   * Content pages must NOT load the SPA: React would boot, clear the article, match no route and
   * redirect the crawler-visible page away. Using a different container id makes that structural
   * rather than a convention someone can forget.
   */
  spa: boolean;
}

export function renderPage({ shell, lang, head, body, spa }: PageOptions): string {
  const container = spa ? 'root' : 'doc';
  return [
    '<!doctype html>',
    `<html lang="${lang}">`,
    '  <head>',
    shell.headBase,
    head,
    spa ? shell.scripts : '',
    '  </head>',
    '  <body>',
    `    <div id="${container}">${body}</div>`,
    '  </body>',
    '</html>',
    '',
  ]
    .filter((part) => part !== '')
    .join('\n');
}
