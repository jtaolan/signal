'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Nav() {
  const pathname = usePathname();

  const links = [
    { href: '/newsletters', label: 'Newsletters' },
    { href: '/about', label: 'About' },
    { href: '/admin', label: 'Admin' },
  ];

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
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  pathname === href
                    ? 'font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={pathname === href ? { color: '#ee7012' } : undefined}
              >
                {label}
              </Link>
            ))}
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
