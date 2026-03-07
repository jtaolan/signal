import Link from 'next/link';
import { Brief } from '@/lib/types';
import { THEMES, THEME_COLORS } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const THEME_BORDER_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#22c55e',
};

export function BriefCard({ brief }: { brief: Brief }) {
  const themeColor = THEMES[brief.theme as ThemeKey]?.color ?? 'gray';
  const borderColor = THEME_BORDER_COLORS[themeColor] ?? '#ee7012';

  return (
    <Link
      href={`/briefs/${brief.briefId}`}
      className="flex gap-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
    >
      {/* Colored accent bar */}
      <div
        className="w-1 shrink-0 rounded-full"
        style={{ backgroundColor: borderColor, minHeight: '60px' }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: borderColor }}>
            {THEMES[brief.theme as ThemeKey]?.label.split(' ')[0] ?? brief.theme}
          </span>
          {brief.contentType === 'podcast' && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Podcast</span>
          )}
        </div>
        <h3 className="text-gray-900 font-semibold text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-[#ee7012] transition-colors">
          {brief.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{brief.summary}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-400">{formatDate(brief.createdAt)}</span>
          {brief.sourceName && (
            <span className="text-xs text-gray-400">· {brief.sourceName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
