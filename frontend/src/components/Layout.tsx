import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">LinguaSwap</div>
        <nav className="nav">
          <NavLink to="/libraries">Libraries</NavLink>
          <NavLink to="/account">Account</NavLink>
        </nav>
        <div className="user-area">
          <span className="user-name">{user?.displayName || user?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
