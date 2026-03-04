'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { unsubscribeByToken } from '@/lib/api';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. No token found.');
      return;
    }
    unsubscribeByToken(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(
          err instanceof Error
            ? err.message
            : 'Unsubscribe failed. The link may be expired or already used.',
        );
      });
  }, [token]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {status === 'loading' && (
        <p className="text-gray-500 animate-pulse">Processing your request…</p>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
          <p className="text-gray-600">{message}</p>
          <p className="text-sm text-gray-400 mt-3">
            You&apos;ll no longer receive Signals digest emails.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-indigo-600 hover:underline"
          >
            ← Back to Signals
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{message}</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-indigo-600 hover:underline"
          >
            ← Back to Signals
          </Link>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-16 text-gray-400 animate-pulse">Loading…</div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
