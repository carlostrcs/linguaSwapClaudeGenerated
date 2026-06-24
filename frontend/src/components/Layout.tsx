import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
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
          <NavLink to="/libraries">{t('nav.libraries')}</NavLink>
          <NavLink to="/stats">{t('nav.stats')}</NavLink>
          <NavLink to="/account">{t('nav.account')}</NavLink>
        </nav>
        <div className="user-area">
          <span className="user-name">{user?.displayName || user?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
            {t('nav.signOut')}
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
