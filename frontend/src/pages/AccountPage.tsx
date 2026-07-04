import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword, deleteAccount, getAccount, updateAccount } from '../api/account';
import { createCheckoutSession, openPortal, startTrial } from '../api/billing';
import { TRIAL_DAYS, trialDaysLeft } from '../lib/premium';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { DEFAULT_THEME, isPremiumTheme, THEMES } from '../theme/themes';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES } from '../i18n/translations';
import type { LanguageId } from '../i18n/translations';
import ConfirmModal from '../components/ConfirmModal';

export default function AccountPage() {
  const { updateUser, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const account = useQuery({ queryKey: ['account'], queryFn: getAccount });

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [billingErr, setBillingErr] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const isPremium = account.data?.isPremium ?? false;
  const subscriptionActive = account.data?.subscriptionActive ?? false;
  const trialEndsAt = account.data?.trialEndsAt ?? null;
  const hiddenLibraries = account.data?.hiddenLibraries ?? 0;
  const trialUsed = trialEndsAt !== null; // a non-null end date means the trial was already started

  // Both Stripe actions redirect the browser to a Stripe-hosted page.
  const upgrade = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e) => setBillingErr(e instanceof ApiError ? e.message : t('premium.upgradeFailed')),
  });
  const portal = useMutation({
    mutationFn: openPortal,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e) => setBillingErr(e instanceof ApiError ? e.message : t('premium.portalFailed')),
  });
  // Starting the trial unlocks premium in place (no redirect); refresh account + libraries so
  // gates and any previously-hidden content update immediately.
  const trial = useMutation({
    mutationFn: startTrial,
    onSuccess: (acc) => {
      updateUser({
        userId: acc.userId,
        email: acc.email,
        displayName: acc.displayName,
        isPremium: acc.isPremium,
        subscriptionActive: acc.subscriptionActive,
        trialEndsAt: acc.trialEndsAt,
      });
      qc.invalidateQueries({ queryKey: ['account'] });
      qc.invalidateQueries({ queryKey: ['libraries'] });
    },
    onError: (e) => setBillingErr(e instanceof ApiError ? e.message : t('premium.trialFailed')),
  });

  useEffect(() => {
    if (account.data) {
      setEmail(account.data.email);
      setDisplayName(account.data.displayName ?? '');
    }
  }, [account.data]);

  // Free users can't keep a premium theme selected (e.g. after a downgrade).
  useEffect(() => {
    if (account.data && !account.data.isPremium && isPremiumTheme(theme)) {
      setTheme(DEFAULT_THEME);
    }
  }, [account.data, theme, setTheme]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    try {
      const updated = await updateAccount(email.trim(), displayName.trim() || null);
      updateUser({
        userId: updated.userId,
        email: updated.email,
        displayName: updated.displayName,
        isPremium: updated.isPremium,
        subscriptionActive: updated.subscriptionActive,
        trialEndsAt: updated.trialEndsAt,
      });
      setProfileMsg(t('account.profileUpdated'));
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : t('account.profileFailed'));
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPwMsg(t('account.passwordChanged'));
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : t('account.passwordFailed'));
    }
  };

  const del = useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      signOut();
      navigate('/login');
    },
    onError: (e) => setDeleteErr(e instanceof ApiError ? e.message : t('account.deleteFailed')),
  });

  return (
    <div className="page narrow">
      <h1>{t('account.title')}</h1>

      <div className="card">
        <h2>{t('premium.title')}</h2>
        {billingErr && <p className="alert alert-error">{billingErr}</p>}
        {subscriptionActive ? (
          // Paid subscription.
          <>
            <p>
              <span className="premium-badge">{t('premium.badge')}</span> {t('premium.activeDesc')}
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setBillingErr(null);
                portal.mutate();
              }}
              disabled={portal.isPending}
            >
              {t('premium.manage')}
            </button>
          </>
        ) : isPremium ? (
          // Active free trial (effective premium, but not yet a paying subscriber).
          <>
            <p>
              <span className="premium-badge">{t('premium.badge')}</span>{' '}
              {t('premium.trialActive', { days: trialDaysLeft(trialEndsAt) })}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setBillingErr(null);
                upgrade.mutate();
              }}
              disabled={upgrade.isPending}
            >
              {upgrade.isPending ? t('premium.redirecting') : t('premium.subscribeToKeep')}
            </button>
          </>
        ) : (
          // Free: never trialed (offer the trial) or trial ended (offer upgrade only).
          <>
            <p className="muted">{trialUsed ? t('premium.trialEnded') : t('premium.freeDesc')}</p>
            {hiddenLibraries > 0 && (
              <p className="alert alert-info">{t('premium.hiddenSubscribeNote', { count: hiddenLibraries })}</p>
            )}
            <div className="card-actions">
              {!trialUsed && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setBillingErr(null);
                    trial.mutate();
                  }}
                  disabled={trial.isPending}
                >
                  {trial.isPending ? t('common.loading') : t('premium.startTrial', { days: TRIAL_DAYS })}
                </button>
              )}
              <button
                type="button"
                className={trialUsed ? 'btn btn-primary' : 'btn btn-ghost'}
                onClick={() => {
                  setBillingErr(null);
                  upgrade.mutate();
                }}
                disabled={upgrade.isPending}
              >
                {upgrade.isPending ? t('premium.redirecting') : t('premium.upgrade')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>{t('account.preferences')}</h2>
        <div className="pref-row">
          <label>
            {t('account.theme')}
            <select
              className="pref-select"
              value={theme}
              onChange={(e) => {
                const next = e.target.value;
                if (isPremiumTheme(next) && !isPremium) return;
                setTheme(next);
              }}
            >
              {THEMES.map((opt) => {
                const locked = (opt.premium ?? false) && !isPremium;
                return (
                  <option key={opt.id} value={opt.id} disabled={locked}>
                    {t(opt.labelKey)}
                    {opt.premium ? ` (${t('premium.badge')})` : ''}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            {t('account.language')}
            <select className="pref-select" value={lang} onChange={(e) => setLang(e.target.value as LanguageId)}>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <form className="card" onSubmit={onSaveProfile}>
        <h2>{t('account.profile')}</h2>
        {profileMsg && <p className="alert alert-success">{profileMsg}</p>}
        {profileErr && <p className="alert alert-error">{profileErr}</p>}
        <label>
          {t('account.displayName')}
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          {t('common.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary">
          {t('account.saveProfile')}
        </button>
      </form>

      <form className="card" onSubmit={onChangePassword}>
        <h2>{t('account.changePassword')}</h2>
        {pwMsg && <p className="alert alert-success">{pwMsg}</p>}
        {pwErr && <p className="alert alert-error">{pwErr}</p>}
        <label>
          {t('account.currentPassword')}
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </label>
        <label>
          {t('account.newPassword')}
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        </label>
        <button type="submit" className="btn btn-primary">
          {t('account.changePassword')}
        </button>
      </form>

      <div className="card danger-zone">
        <h2>{t('account.dangerZone')}</h2>
        <p className="muted">{t('account.deleteDesc')}</p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => { setDeleteErr(null); setConfirmingDelete(true); }}
        >
          {t('account.deleteAccount')}
        </button>
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title={t('account.deleteTitle')}
          message={t('account.deleteConfirm')}
          confirmLabel={t('account.deleteAccount')}
          busy={del.isPending}
          error={deleteErr}
          onConfirm={() => { setDeleteErr(null); del.mutate(); }}
          onClose={() => { setConfirmingDelete(false); setDeleteErr(null); }}
        />
      )}
    </div>
  );
}
