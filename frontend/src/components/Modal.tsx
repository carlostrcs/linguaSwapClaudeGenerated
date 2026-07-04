import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for the dialog (announced by screen readers). */
  label?: string;
}

/**
 * Reusable modal shell: a dimmed overlay + centered card. Closes on overlay click or Escape.
 * Callers supply the inner content (title, body, actions). Styling lives in index.css
 * (.modal-overlay / .modal-card / .modal-actions).
 */
export default function Modal({ onClose, children, label }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card card"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
