'use client';

import { useState } from 'react';
import Link from 'next/link';
import { THEMES, THEME_COLORS } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';
import { subscribe } from '@/lib/api';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<ThemeKey[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const toggleTheme = (theme: ThemeKey) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selectedThemes.length === 0) return;
    setStatus('loading');
    try {
      const res = await subscribe(email, selectedThemes);
      setStatus('success');
      setMessage(res.message);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re subscribed!</h1>
        <p className="text-gray-600">{message}</p>
        <p className="text-sm text-gray-400 mt-3">
          You&apos;ll receive weekly digest emails with AI-generated decision briefs from your
          selected feeds.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Browse Briefs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscribe to Signals</h1>
        <p className="text-gray-600">
          Get weekly AI-curated decision briefs delivered to your inbox. Select the feeds most
          relevant to your role.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="you@university.edu"
          />
        </div>

        {/* Theme selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Select feeds{' '}
            <span className="text-gray-400 font-normal">(choose at least one)</span>
          </p>
          <div className="space-y-3">
            {(Object.keys(THEMES) as ThemeKey[]).map((theme) => {
              const config = THEMES[theme];
              const colors = THEME_COLORS[config.color];
              const checked = selectedThemes.includes(theme);
              return (
                <label
                  key={theme}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    checked
                      ? `${colors.bg} ${colors.border} border-2`
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTheme(theme)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    <span className="text-sm font-medium text-gray-900 block">
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-500 leading-relaxed">
                      {config.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'loading' || !email || selectedThemes.length === 0}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>

        <p className="text-xs text-center text-gray-400">
          You can unsubscribe at any time via the link in your email. No spam, ever.
        </p>
      </form>
    </div>
  );
}
