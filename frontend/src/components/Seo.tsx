import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { OG_IMAGE } from '../content/seo';
import type { RouteSeo } from '../content/seo';
import { SITE_NAME, absoluteUrl, siteUrl } from '../content/site';

/**
 * Per-route `<head>` metadata.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere in the tree, so this needs no
 * helmet dependency. What React does NOT do is de-duplicate against tags already present in the
 * served HTML — and the build generator bakes a `<head>` into every prerendered page. Without the
 * cleanup below, a prerendered route would end up with two `<title>`s and two descriptions after
 * mount, which is exactly the ambiguity that makes a crawler pick the wrong one.
 *
 * The cleanup lives here rather than in `main.tsx` on purpose: a route that renders no `<Seo/>`
 * (the protected pages) then keeps its prerendered tags, which is the right fallback. And because
 * the effect runs after React has committed its own tags, there is never a frame with no title.
 */
export default function Seo({ title, description, robots = 'index,follow' }: RouteSeo) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.head.querySelectorAll('[data-prerendered-seo]').forEach((node) => node.remove());
  }, []);

  const base = siteUrl(import.meta.env.VITE_SITE_URL);
  // Canonical is always self, from the path only — query strings (`?token=…`, `?lang=…`) must
  // never end up in a canonical or every variant becomes its own URL.
  const canonical = absoluteUrl(base, pathname);
  const image = absoluteUrl(base, OG_IMAGE);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
