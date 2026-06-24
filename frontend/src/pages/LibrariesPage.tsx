import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLibrary, deleteLibrary, listLibraries, updateLibrary } from '../api/libraries';
import { ApiError } from '../api/client';

export default function LibrariesPage() {
  const qc = useQueryClient();
  const { data: libraries, isLoading, isError } = useQuery({ queryKey: ['libraries'], queryFn: listLibraries });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['libraries'] });

  const create = useMutation({
    mutationFn: () => createLibrary(name.trim(), description.trim() || null),
    onSuccess: () => {
      setName('');
      setDescription('');
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : 'Could not create library.'),
  });

  const rename = useMutation({
    mutationFn: (vars: { id: number; name: string }) => updateLibrary(vars.id, vars.name),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteLibrary(id),
    onSuccess: invalidate,
  });

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please give the library a name.');
      return;
    }
    create.mutate();
  };

  const onRename = (id: number, current: string) => {
    const next = window.prompt('New library name:', current);
    if (next && next.trim()) rename.mutate({ id, name: next.trim() });
  };

  const onDelete = (id: number, libName: string) => {
    if (window.confirm(`Delete "${libName}" and all its words? This cannot be undone.`)) remove.mutate(id);
  };

  return (
    <div className="page">
      <h1>Your libraries</h1>

      <form className="card create-form" onSubmit={onCreate}>
        <h2>New library</h2>
        {formError && <p className="alert alert-error">{formError}</p>}
        <div className="inline-fields">
          <input placeholder="Name (e.g. Travel Spanish)" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            Add
          </button>
        </div>
      </form>

      {isLoading && <p className="muted">Loading…</p>}
      {isError && <p className="alert alert-error">Could not load libraries.</p>}
      {libraries && libraries.length === 0 && <p className="muted">No libraries yet — create your first one above.</p>}

      <div className="library-grid">
        {libraries?.map((lib) => (
          <div className="card library-card" key={lib.id}>
            <div className="library-card-head">
              <Link className="library-title" to={`/libraries/${lib.id}`}>
                {lib.name}
              </Link>
              <span className="badge">
                {lib.entryCount} word{lib.entryCount === 1 ? '' : 's'}
              </span>
            </div>
            {lib.description && <p className="muted">{lib.description}</p>}
            <div className="card-actions">
              <Link className="btn btn-secondary" to={`/libraries/${lib.id}`}>
                Open
              </Link>
              <Link className="btn btn-primary" to={`/practice/${lib.id}`}>
                Practise
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => onRename(lib.id, lib.name)}>
                Rename
              </button>
              <button type="button" className="btn btn-danger" onClick={() => onDelete(lib.id, lib.name)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
