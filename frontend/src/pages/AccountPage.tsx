import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { changePassword, deleteAccount, getAccount, updateAccount } from '../api/account';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { THEMES } from '../theme/themes';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES } from '../i18n/translations';
import type { LanguageId } from '../i18n/translations';

export default function AccountPage() {
  const { updateUser, signOut } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (account.data) {
      setEmail(account.data.email);
      setDisplayName(account.data.displayName ?? '');
    }
  }, [account.data]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    try {
      const updated = await updateAccount(email.trim(), displayName.trim() || null);
      updateUser({ userId: updated.userId, email: updated.email, displayName: updated.displayName });
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

  const onDelete = async () => {
    if (!window.confirm(t('account.deleteConfirm'))) return;
    try {
      await deleteAccount();
      signOut();
      navigate('/login');
    } catch {
      window.alert(t('account.deleteFailed'));
    }
  };

  return (
    <div className="page narrow">
      <h1>{t('account.title')}</h1>

      <div className="card">
        <h2>{t('account.preferences')}</h2>
        <div className="pref-row">
          <label>
            {t('account.theme')}
            <select className="pref-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
              {THEMES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {t(opt.labelKey)}
                </option>
              ))}
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
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          {t('account.deleteAccount')}
        </button>
      </div>
    </div>
  );
}
