import { useState } from 'react';
import type { FormEvent } from 'react';
import type { EntryDto, TranslationDto } from '../api/types';

interface Props {
  initial?: EntryDto | null;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (translations: TranslationDto[], notes: string | null) => void;
  onCancel?: () => void;
}

const defaultRows: TranslationDto[] = [
  { languageCode: 'en', text: '' },
  { languageCode: 'es', text: '' },
];

export default function EntryForm({ initial, submitLabel, busy, error, onSubmit, onCancel }: Props) {
  const [rows, setRows] = useState<TranslationDto[]>(() =>
    initial && initial.translations.length > 0
      ? initial.translations.map((t) => ({ ...t }))
      : defaultRows.map((r) => ({ ...r })),
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  const updateRow = (index: number, field: keyof TranslationDto, value: string) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  const addRow = () => setRows((prev) => [...prev, { languageCode: '', text: '' }]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const cleaned = rows
      .map((r) => ({ languageCode: r.languageCode.trim().toLowerCase(), text: r.text.trim() }))
      .filter((r) => r.languageCode && r.text);

    if (cleaned.length === 0) {
      setLocalError('Add at least one language with its translation.');
      return;
    }
    const langs = cleaned.map((r) => r.languageCode);
    if (new Set(langs).size !== langs.length) {
      setLocalError('Each language can only appear once.');
      return;
    }
    onSubmit(cleaned, notes.trim() || null);
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {(error || localError) && <p className="alert alert-error">{error ?? localError}</p>}
      <div className="translation-rows">
        {rows.map((row, i) => (
          <div className="translation-row" key={i}>
            <input
              className="lang-input"
              placeholder="lang"
              value={row.languageCode}
              onChange={(e) => updateRow(i, 'languageCode', e.target.value)}
            />
            <input
              className="text-input"
              placeholder="word or phrase"
              value={row.text}
              onChange={(e) => updateRow(i, 'text', e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => removeRow(i)}
              disabled={rows.length === 1}
              title="Remove language"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-link" onClick={addRow}>
        + Add language
      </button>
      <label>
        Notes (optional)
        <input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
