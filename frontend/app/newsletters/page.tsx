import Link from 'next/link';
import { THEMES } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';

const THEME_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#22c55e',
};

const THEME_SOURCES: Record<ThemeKey, string> = {
  accessibility_title2: 'DOJ, Section508.gov, AHEAD, OCR, Disability rights publications, and the full web',
  ai_governance: 'Inside Higher Ed, Chronicle of Higher Ed, EDUCAUSE, AI policy reports, and the full web',
  curriculum_accreditation: 'AACSB, ABET, HLC, SACSCOC, AAC&U, and the full web',
  student_success: 'EAB, NASPA, ACPA, Achieving the Dream, and the full web',
};

export const metadata = {
  title: 'Newsletters — Signals',
  description: 'Four weekly decision briefs covering the most critical topics in higher education.',
};

export default function NewslettersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#ee7012' }}>
          Newsletters
        </p>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          The insights you'd get from 100 sources — in one email.
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          Every week, Signals scans hundreds of sources across higher education and distills them into
          four themed decision briefs, delivered every Monday morning.
        </p>
      </div>

      {/* Newsletter cards */}
      <div className="space-y-6">
        {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
          const config = THEMES[key];
          const color = THEME_COLORS[config.color] ?? '#ee7012';

          return (
            <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Color bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color }}
                    >
                      Weekly · Every Monday
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1 mb-2">{config.label}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{config.description}</p>
                    <p className="text-xs text-gray-400">
                      <span className="font-medium text-gray-500">Sources: </span>
                      {THEME_SOURCES[key]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                  <Link
                    href={`/feeds/${key}`}
                    className="text-sm font-semibold hover:underline"
                    style={{ color }}
                  >
                    View latest briefs →
                  </Link>
                  <span className="text-gray-200">|</span>
                  <Link
                    href="/subscribe"
                    className="text-sm text-gray-500 hover:text-gray-800"
                  >
                    Subscribe to get this in your inbox
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-14 text-center py-10 border border-dashed border-gray-200 rounded-xl">
        <p className="text-gray-900 font-bold text-lg mb-2">Get all four briefs every Monday.</p>
        <p className="text-gray-500 text-sm mb-6">Free. No spam. Unsubscribe anytime.</p>
        <Link
          href="/subscribe"
          className="text-sm font-bold text-white px-6 py-3 rounded transition-colors"
          style={{ backgroundColor: '#ee7012' }}
        >
          Subscribe — free
        </Link>
      </div>
    </div>
  );
}
