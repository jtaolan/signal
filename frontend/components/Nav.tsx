'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { THEMES } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';

export function Nav() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="font-bold text-2xl tracking-tight" style={{ color: '#ee7012' }}>
            Signals
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">

            {/* Newsletters dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  pathname.startsWith('/feeds') ? 'font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={pathname.startsWith('/feeds') ? { color: '#ee7012' } : undefined}
              >
                Newsletters
                <svg className="w-3 h-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                  {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                    <Link
                      key={key}
                      href={`/feeds/${key}`}
                      onClick={() => setDropdownOpen(false)}
                      className={`block px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                        pathname === `/feeds/${key}` ? 'font-semibold' : 'text-gray-700'
                      }`}
                      style={pathname === `/feeds/${key}` ? { color: '#ee7012' } : undefined}
                    >
                      {THEMES[key].label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/about"
              className={`text-sm transition-colors ${
                pathname === '/about' ? 'font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
              style={pathname === '/about' ? { color: '#ee7012' } : undefined}
            >
              About
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
