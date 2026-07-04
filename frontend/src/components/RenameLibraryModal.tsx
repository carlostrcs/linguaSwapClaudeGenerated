import { useState } from 'react';
import type { FormEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import Modal from './Modal';

interface Props {
  currentName: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/**
 * Modal form for renaming a library — prefilled with the current name, submits the trimmed value.
 * Shared by the real and demo library editors. Replaces the old window.prompt flow.
 */
export default function RenameLibraryModal({ currentName, busy, error, onSubmit, onClose }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(currentName);
  const trimmed = name.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Modal onClose={onClose} label={t('libraries.renameTitle')}>
      <form onSubmit={submit}>
        <h2>{t('libraries.renameTitle')}</h2>
        {error && <p className="alert alert-error">{error}</p>}
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('libraries.namePlaceholder')}
        />
        <div className="modal-actions">
          <button type="submit" className="btn btn-primary" disabled={busy || !trimmed}>
            {t('common.save')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
