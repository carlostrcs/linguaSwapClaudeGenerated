// Static intro for `/demo`.
//
// The real demo is entirely localStorage-driven, so there is nothing meaningful to prerender from
// it — but `/demo` is a strong entry point ("try vocabulary practice, no sign-up"), and shipping
// an empty body would make it a thin page for anything that does not run JavaScript. This is a
// short, honest description of the page, replaced by React on mount.

import { translator } from '../../src/i18n/interpolate';
import { escapeHtml } from '../html';

export function renderDemoIntro(): string {
  const t = translator('en');
  const e = (key: string) => escapeHtml(t(key));

  return `
    <div class="app">
      <header class="topbar">
        <a class="brand" href="/">LinguaSwap</a>
        <span class="badge">${e('demo.badge')}</span>
      </header>
      <main class="content">
        <h1>${e('demo.librariesTitle')}</h1>
        <p class="muted">${e('demo.banner')}</p>
        <p class="muted">${e('landing.demoNote')}</p>
        <p>
          <a class="btn btn-primary" href="/register">${e('landing.getStarted')}</a>
          <a class="btn btn-secondary" href="/">${e('auth.backHome')}</a>
        </p>
      </main>
    </div>
  `;
}
