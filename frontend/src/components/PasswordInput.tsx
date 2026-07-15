import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

// Feather "eye" / "eye-off" icons, inlined (no icon lib in this project; keeps it CSP-safe).
const EyeIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minLength?: number;
  'aria-invalid'?: boolean;
};

/** A password input with a show/hide eye toggle. Manages its own visibility state.
 *  Shared by the register and reset-password forms. */
export default function PasswordInput({
  value,
  onChange,
  className,
  minLength,
  ...rest
}: PasswordInputProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const label = visible ? t('auth.hidePassword') : t('auth.showPassword');
  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={minLength}
        className={className}
        {...rest}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        {visible ? EyeOffIcon : EyeIcon}
      </button>
    </div>
  );
}
