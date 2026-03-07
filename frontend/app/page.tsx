import Link from 'next/link';
import { BriefCard } from '@/components/BriefCard';
import { THEMES } from '@/lib/themes';
import { fetchFeeds } from '@/lib/api';
import { Brief, ThemeKey } from '@/lib/types';

const THEME_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#22c55e',
};

async function getLatestBriefs(theme: ThemeKey): Promise<Brief[]> {
  try {
    const data = await fetchFeeds(theme, undefined, 4);
    return data.briefs;
  } catch {
    return [];
  }
}

async function ThemeFeedSection({ theme }: { theme: ThemeKey }) {
  const briefs = await getLatestBriefs(theme);
  const config = THEMES[theme];
  const accentColor = THEME_COLORS[config.color] ?? '#ee7012';

  return (
    <section className="mb-14">
      {/* Section header */}
      <div className="flex items-center justify-between mb-1 pb-3 border-b-2" style={{ borderColor: accentColor }}>
        <h2 className="font-bold text-lg text-gray-900">{config.label}</h2>
        <Link
          href={`/feeds/${theme}`}
          className="text-sm font-medium hover:underline"
          style={{ color: accentColor }}
        >
          View all →
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">{config.description}</p>

      {briefs.length === 0 ? (
        <p className="text-sm text-gray-400 py-6">No briefs published yet.</p>
      ) : (
        <div>
          {briefs.map((brief) => (
            <BriefCard key={brief.briefId} brief={brief} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-12 pb-10 border-b border-gray-200">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#ee7012' }}>
          Higher Education Intelligence
        </p>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          Decision Briefs for Academic Administrators
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-6">
          AI-curated signals on accessibility compliance, AI governance, accreditation, and student
          success — compressed into actionable briefs, delivered weekly.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/subscribe"
            className="text-sm font-semibold text-white px-5 py-2.5 rounded transition-colors"
            style={{ backgroundColor: '#ee7012' }}
          >
            Get Weekly Digest
          </Link>
          <Link
            href="/feeds/ai_governance"
            className="text-sm font-semibold text-gray-700 border border-gray-300 px-5 py-2.5 rounded hover:bg-gray-50 transition-colors"
          >
            Browse All Briefs
          </Link>
        </div>
      </div>

      {/* Feed sections */}
      {(Object.keys(THEMES) as ThemeKey[]).map((theme) => (
        <ThemeFeedSection key={theme} theme={theme} />
      ))}
    </div>
  );
}
