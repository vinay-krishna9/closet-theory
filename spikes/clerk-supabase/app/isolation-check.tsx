'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';

export function IsolationCheck() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <Panel key={userId} />;
}

function Panel() {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function run(method: string, id?: string, label?: string) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(
        `/api/items${method === 'GET' && id ? `?id=${encodeURIComponent(id)}` : ''}`,
        {
          method,
          cache: 'no-store',
          ...(method === 'GET'
            ? {}
            : {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, label }),
              }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          response.status === 404
            ? 'No accessible test record found.'
            : 'Test operation failed. Check your sign-in and input, then retry.',
        );
        return;
      }
      if (method === 'GET') setItems(result.items);
      else if (method === 'DELETE')
        setItems((current) => current.filter((item) => item.id !== id));
      else
        setItems((current) => [
          ...current.filter((item) => item.id !== id),
          ...result.items,
        ]);
      setMessage('Test operation succeeded.');
    } catch {
      setMessage('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="isolation-heading">
      <h2 id="isolation-heading">Database isolation check</h2>
      <p>
        These controls create and manage disposable test records only. Copy a
        record ID to check access from your other test account.
      </p>
      <div className="actions">
        <button
          disabled={busy}
          onClick={() => run('POST', crypto.randomUUID(), 'SPIKE-02 A')}
        >
          Create test record A
        </button>
        <button
          disabled={busy}
          onClick={() => run('POST', crypto.randomUUID(), 'SPIKE-02 B')}
        >
          Create test record B
        </button>
        <button disabled={busy} onClick={() => run('GET')}>
          Load my test records
        </button>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <p>
              {item.label} <code>{item.id}</code>
            </p>
            <div className="actions">
              <button
                disabled={busy}
                onClick={() =>
                  run(
                    'PATCH',
                    item.id,
                    item.label === 'SPIKE-02 A' ? 'SPIKE-02 B' : 'SPIKE-02 A',
                  )
                }
              >
                Change test label
              </button>
              <button disabled={busy} onClick={() => run('DELETE', item.id)}>
                Delete test record
              </button>
            </div>
          </li>
        ))}
      </ul>
      <label htmlFor="target-record">Record ID to check</label>
      <input
        id="target-record"
        value={target}
        onChange={(event) => setTarget(event.target.value)}
      />
      <button
        disabled={busy || !target.trim()}
        onClick={() => run('GET', target.trim())}
      >
        Check record access
      </button>
      <p role="status">{busy ? 'Checking test records…' : message}</p>
    </section>
  );
}
