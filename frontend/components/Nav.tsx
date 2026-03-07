'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { THEMES } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-2xl tracking-tight" style={{ color: '#ee7012' }}>
            Signals
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
              <Link
                key={key}
                href={`/feeds/${key}`}
                className={`text-sm transition-colors ${
                  pathname === `/feeds/${key}`
                    ? 'font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={pathname === `/feeds/${key}` ? { color: '#ee7012' } : undefined}
              >
                {THEMES[key].label.split(' ')[0]}
              </Link>
            ))}
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Admin
            </Link>
          </div>

          {/* Subscribe */}
          <Link
            href="/subscribe"
            className="text-sm font-semibold text-white px-4 py-2 rounded transition-colors"
            style={{ backgroundColor: '#ee7012' }}
          >
            Subscribe
          </Link>
        </div>
      </div>
    </nav>
  );
}
