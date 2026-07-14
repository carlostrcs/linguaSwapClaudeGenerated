/// <reference types="vite/client" />

// Merges into Vite's own ImportMetaEnv (which supplies DEV/PROD/MODE/...).
interface ImportMetaEnv {
  /** Base URL of the LinguaSwap API, including the /api suffix.
   *  e.g. https://linguaswap-api.onrender.com/api — set in the Vercel dashboard.
   *  Unset in local dev, where the client falls back to http://localhost:5299/api. */
  readonly VITE_API_URL?: string;
}
