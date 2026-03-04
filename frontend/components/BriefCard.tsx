import Link from 'next/link';
import { Brief } from '@/lib/types';
import { ThemeBadge } from './ThemeBadge';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BriefCard({ brief }: { brief: Brief }) {
  return (
    <Link
      href={`/briefs/${brief.briefId}`}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-indigo-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <ThemeBadge theme={brief.theme} />
        <div className="flex items-center gap-2 shrink-0">
          {brief.contentType === 'podcast' && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Podcast
            </span>
          )}
          <span className="text-xs text-gray-400">{formatDate(brief.createdAt)}</span>
        </div>
      </div>
      <h3 className="text-gray-900 font-semibold text-sm leading-snug mb-2 line-clamp-2">
        {brief.title}
      </h3>
      <p className="text-gray-500 text-sm line-clamp-3">{brief.summary}</p>
      {brief.sourceName && (
        <p className="mt-3 text-xs text-gray-400">Source: {brief.sourceName}</p>
      )}
    </Link>
  );
}
