import { useI18n } from '../i18n/I18nProvider';
import Modal from './Modal';

interface Props {
  /** Dialog heading (also the accessible label). */
  title: string;
  /** Body text explaining what will happen. */
  message: string;
  /** Confirm-button label. Defaults to the shared "Delete" string. */
  confirmLabel?: string;
  /** Cancel-button label. Defaults to the shared "Cancel" string. */
  cancelLabel?: string;
  /** Style the confirm button as destructive (red). Defaults to true. */
  danger?: boolean;
  /** Disable the actions while the confirmed action is in flight. */
  busy?: boolean;
  /** Optional error to surface inside the dialog (e.g. a failed delete). */
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Reusable confirmation dialog built on the shared Modal shell — replaces the browser-native
 * window.confirm/window.alert flows so destructive actions get an in-app, themed prompt.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  busy,
  error,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useI18n();

  return (
    <Modal onClose={onClose} label={title}>
      <h2>{title}</h2>
      {error && <p className="alert alert-error">{error}</p>}
      <p className="muted">{message}</p>
      <div className="modal-actions">
        <button
          type="button"
          className={danger ? 'btn btn-danger' : 'btn btn-primary'}
          onClick={onConfirm}
          disabled={busy}
        >
          {confirmLabel ?? t('common.delete')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {cancelLabel ?? t('common.cancel')}
        </button>
      </div>
    </Modal>
  );
}
