import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  onClose: () => void;
}

/**
 * Shown after a logged-out visitor finishes or leaves a demo practice session, inviting them to
 * create an account. Closes on overlay click or Escape.
 */
export default function RegisterPromptModal({ onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{t('demo.modal.title')}</h2>
        <p className="muted">{t('demo.modal.body')}</p>
        <div className="modal-actions">
          <Link className="btn btn-primary" to="/register">
            {t('demo.modal.createAccount')}
          </Link>
          <Link className="btn btn-secondary" to="/login">
            {t('demo.modal.signIn')}
          </Link>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('demo.modal.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
