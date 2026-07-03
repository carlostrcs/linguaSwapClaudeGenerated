import { Link, Outlet } from 'react-router-dom';

/**
 * Minimal chrome for the logged-out auth pages (Login / Register): the app topbar with just the
 * clickable "LinguaSwap" brand over the centred `.content` shell, so these pages match the rest
 * of the app and the user can always click the brand to return home.
 */
export default function AuthLayout() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
