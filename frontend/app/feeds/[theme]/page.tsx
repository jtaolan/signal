import { notFound } from 'next/navigation';
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

interface Props {
  params: { theme: string };
  searchParams: { cursor?: string };
}

export async function generateStaticParams() {
  return Object.keys(THEMES).map((theme) => ({ theme }));
}

export async function generateMetadata({ params }: Props) {
  const config = THEMES[params.theme as ThemeKey];
  if (!config) return {};
  return {
    title: `${config.label} — Signals`,
    description: config.description,
  };
}

export default async function ThemeFeedPage({ params, searchParams }: Props) {
  const theme = params.theme as ThemeKey;
  if (!(theme in THEMES)) notFound();

  const config = THEMES[theme];
  const accentColor = THEME_COLORS[config.color] ?? '#ee7012';

  let briefs: Brief[] = [];
  let nextCursor: string | null = null;

  try {
    const data = await fetchFeeds(theme, searchParams.cursor, 20);
    briefs = data.briefs;
    nextCursor = data.cursor;
  } catch {
    // show empty state
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link href="/" className="text-sm hover:underline" style={{ color: '#ee7012' }}>
        ← All Topics
      </Link>

      {/* Header */}
      <div className="mt-6 mb-8 pb-4 border-b-2" style={{ borderColor: accentColor }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accentColor }}>
          Topic
        </p>
        <h1 className="text-3xl font-bold text-gray-900">{config.label}</h1>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">{config.description}</p>
      </div>

      {/* Briefs */}
      {briefs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No briefs yet</p>
          <p className="text-sm">Check back after the next ingestion cycle.</p>
        </div>
      ) : (
        <div>
          {briefs.map((brief) => (
            <BriefCard key={brief.briefId} brief={brief} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        {searchParams.cursor ? (
          <Link href={`/feeds/${theme}`} className="text-sm hover:underline" style={{ color: '#ee7012' }}>
            ← Newer briefs
          </Link>
        ) : (
          <span />
        )}
        {nextCursor && (
          <Link
            href={`/feeds/${theme}?cursor=${encodeURIComponent(nextCursor)}`}
            className="text-sm hover:underline"
            style={{ color: '#ee7012' }}
          >
            Older briefs →
          </Link>
        )}
      </div>
    </div>
  );
}
