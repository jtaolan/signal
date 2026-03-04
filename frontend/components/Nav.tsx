'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { THEMES } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-indigo-600 tracking-tight">
            Signals
          </Link>

          {/* Theme links (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-1">
            {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
              <Link
                key={key}
                href={`/feeds/${key}`}
                className={clsx(
                  'text-sm px-3 py-1.5 rounded-md transition-colors',
                  pathname === `/feeds/${key}`
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50',
                )}
              >
                {THEMES[key].label.split(' / ')[0].split(' & ')[0]}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1.5 hidden sm:block"
            >
              Admin
            </Link>
            <Link
              href="/subscribe"
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 font-medium"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
