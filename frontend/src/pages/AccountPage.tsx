import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { changePassword, deleteAccount, getAccount, updateAccount } from '../api/account';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function AccountPage() {
  const { updateUser, signOut } = useAuth();
  const navigate = useNavigate();
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
      setProfileMsg('Profile updated.');
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : 'Could not update profile.');
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
      setPwMsg('Password changed.');
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : 'Could not change password.');
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete your account and ALL your data? This cannot be undone.')) return;
    try {
      await deleteAccount();
      signOut();
      navigate('/login');
    } catch {
      window.alert('Could not delete account.');
    }
  };

  return (
    <div className="page narrow">
      <h1>Account settings</h1>

      <form className="card" onSubmit={onSaveProfile}>
        <h2>Profile</h2>
        {profileMsg && <p className="alert alert-success">{profileMsg}</p>}
        {profileErr && <p className="alert alert-error">{profileErr}</p>}
        <label>
          Display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary">
          Save profile
        </button>
      </form>

      <form className="card" onSubmit={onChangePassword}>
        <h2>Change password</h2>
        {pwMsg && <p className="alert alert-success">{pwMsg}</p>}
        {pwErr && <p className="alert alert-error">{pwErr}</p>}
        <label>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </label>
        <label>
          New password (6+ characters)
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        </label>
        <button type="submit" className="btn btn-primary">
          Change password
        </button>
      </form>

      <div className="card danger-zone">
        <h2>Danger zone</h2>
        <p className="muted">Deleting your account removes all your libraries, words and statistics.</p>
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          Delete my account
        </button>
      </div>
    </div>
  );
}
