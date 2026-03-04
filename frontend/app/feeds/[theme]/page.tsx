import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BriefCard } from '@/components/BriefCard';
import { THEMES, THEME_COLORS } from '@/lib/themes';
import { fetchFeeds } from '@/lib/api';
import { ThemeKey } from '@/lib/types';

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
  const colors = THEME_COLORS[config.color];

  let briefs = [];
  let nextCursor: string | null = null;

  try {
    const data = await fetchFeeds(theme, searchParams.cursor, 20);
    briefs = data.briefs;
    nextCursor = data.cursor;
  } catch {
    // show empty state
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← All Feeds
        </Link>
        <div className={`mt-4 p-5 rounded-xl border ${colors.bg} ${colors.border}`}>
          <h1 className="text-2xl font-bold text-gray-900">{config.label}</h1>
          <p className="text-gray-600 mt-1 text-sm">{config.description}</p>
        </div>
      </div>

      {/* Briefs */}
      {briefs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No briefs yet</p>
          <p className="text-sm">Check back after the next ingestion cycle.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => (
            <BriefCard key={brief.briefId} brief={brief} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        {searchParams.cursor ? (
          <Link href={`/feeds/${theme}`} className="text-sm text-indigo-600 hover:underline">
            ← Newer briefs
          </Link>
        ) : (
          <span />
        )}
        {nextCursor && (
          <Link
            href={`/feeds/${theme}?cursor=${encodeURIComponent(nextCursor)}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            Older briefs →
          </Link>
        )}
      </div>
    </div>
  );
}
