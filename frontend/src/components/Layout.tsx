import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAccount } from '../api/account';
import { useAuth } from '../auth/AuthContext';
import { trialDaysLeft } from '../lib/premium';
import { useI18n } from '../i18n/I18nProvider';
import ConfirmEmailBanner from './ConfirmEmailBanner';

export default function Layout() {
  const { user, updateUser, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // On mobile the nav collapses behind a hamburger toggle (full bar on desktop). Close it whenever
  // the route changes so tapping a link navigates and tidies up.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Keep the locally-stored premium flag in sync with the server (handles a stale snapshot,
  // an upgrade, or a subscription cancelled elsewhere). The API stays authoritative regardless.
  const account = useQuery({ queryKey: ['account'], queryFn: getAccount });
  useEffect(() => {
    if (!account.data || !user) return;
    const { isPremium, subscriptionActive, trialEndsAt, emailConfirmed } = account.data;
    if (
      isPremium !== user.isPremium ||
      subscriptionActive !== user.subscriptionActive ||
      (trialEndsAt ?? null) !== (user.trialEndsAt ?? null) ||
      emailConfirmed !== user.emailConfirmed
    ) {
      updateUser({ ...user, isPremium, subscriptionActive, trialEndsAt, emailConfirmed });
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
      <ConfirmEmailBanner />
      {onTrial && (
        <div className="trial-banner">
          {t('premium.trialBanner', { days: trialDaysLeft(user!.trialEndsAt) })}{' '}
          <Link to="/account">{t('premium.subscribeToKeep')}</Link>
        </div>
      )}
      <header className={`topbar${menuOpen ? ' open' : ''}`}>
        <Link to="/" className="brand">
          LinguaSwap
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={t('nav.menu')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰
        </button>
        {/* Wrapper is `display: contents` on desktop (invisible), so brand/nav/user-area lay out
            exactly as before; on mobile it becomes the collapsible dropdown. */}
        <div className="nav-collapse">
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
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
