import { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAccount } from '../api/account';
import { useAuth } from '../auth/AuthContext';
import { trialDaysLeft } from '../lib/premium';
import { useI18n } from '../i18n/I18nProvider';

export default function Layout() {
  const { user, updateUser, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Keep the locally-stored premium flag in sync with the server (handles a stale snapshot,
  // an upgrade, or a subscription cancelled elsewhere). The API stays authoritative regardless.
  const account = useQuery({ queryKey: ['account'], queryFn: getAccount });
  useEffect(() => {
    if (!account.data || !user) return;
    const { isPremium, subscriptionActive, trialEndsAt } = account.data;
    if (
      isPremium !== user.isPremium ||
      subscriptionActive !== user.subscriptionActive ||
      (trialEndsAt ?? null) !== (user.trialEndsAt ?? null)
    ) {
      updateUser({ ...user, isPremium, subscriptionActive, trialEndsAt });
    }
  }, [account.data, user, updateUser]);

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  // Shown only during an active trial (effective premium, not yet a paying subscriber).
  const onTrial = !!user?.isPremium && !user?.subscriptionActive && !!user?.trialEndsAt;

  return (
    <div className="app">
      {onTrial && (
        <div className="trial-banner">
          {t('premium.trialBanner', { days: trialDaysLeft(user!.trialEndsAt) })}{' '}
          <Link to="/account">{t('premium.subscribeToKeep')}</Link>
        </div>
      )}
      <header className="topbar">
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
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
