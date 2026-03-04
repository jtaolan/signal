import Link from 'next/link';
import { BriefCard } from '@/components/BriefCard';
import { THEMES, THEME_COLORS } from '@/lib/themes';
import { fetchFeeds } from '@/lib/api';
import { Brief, ThemeKey } from '@/lib/types';

async function getLatestBriefs(theme: ThemeKey): Promise<Brief[]> {
  try {
    const data = await fetchFeeds(theme, undefined, 3);
    return data.briefs;
  } catch {
    return [];
  }
}

async function ThemeFeedSection({ theme }: { theme: ThemeKey }) {
  const briefs = await getLatestBriefs(theme);
  const config = THEMES[theme];
  const colors = THEME_COLORS[config.color];

  return (
    <section className={`bg-white border rounded-xl overflow-hidden ${colors.border}`}>
      <div className={`px-6 py-4 border-b ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">{config.label}</h2>
          <Link
            href={`/feeds/${theme}`}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{config.description}</p>
      </div>
      <div className="p-4">
        {briefs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No briefs published yet.</p>
        ) : (
          <div className="space-y-3">
            {briefs.map((brief) => (
              <BriefCard key={brief.briefId} brief={brief} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default async function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          Higher Ed Intelligence
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Decision Briefs for Academic Administrators
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          AI-curated signals on accessibility compliance, AI governance, accreditation, and student
          success — compressed into actionable briefs, delivered weekly.
        </p>
        <div className="mt-7 flex gap-3 justify-center flex-wrap">
          <Link
            href="/subscribe"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Get Weekly Digest
          </Link>
          <Link
            href="/feeds/ai_governance"
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Browse Briefs
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex justify-center gap-8 mb-10 text-center">
        {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
          <Link
            key={key}
            href={`/feeds/${key}`}
            className="group"
          >
            <div
              className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                { amber: 'bg-amber-400', purple: 'bg-purple-400', blue: 'bg-blue-400', green: 'bg-green-400' }[THEMES[key].color]
              }`}
            />
            <span className="text-xs text-gray-500 group-hover:text-indigo-600">
              {THEMES[key].label.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>

      {/* Feed grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(THEMES) as ThemeKey[]).map((theme) => (
          <ThemeFeedSection key={theme} theme={theme} />
        ))}
      </div>
    </div>
  );
}
