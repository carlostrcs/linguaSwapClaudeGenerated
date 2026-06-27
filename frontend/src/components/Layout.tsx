import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAccount } from '../api/account';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

export default function Layout() {
  const { user, updateUser, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Keep the locally-stored premium flag in sync with the server (handles a stale snapshot,
  // an upgrade, or a subscription cancelled elsewhere). The API stays authoritative regardless.
  const account = useQuery({ queryKey: ['account'], queryFn: getAccount });
  useEffect(() => {
    if (account.data && user && account.data.isPremium !== user.isPremium) {
      updateUser({ ...user, isPremium: account.data.isPremium });
    }
  }, [account.data, user, updateUser]);

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
