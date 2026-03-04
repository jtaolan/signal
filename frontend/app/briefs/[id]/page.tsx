import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchBrief } from '@/lib/api';
import { ThemeBadge } from '@/components/ThemeBadge';
import { Brief } from '@/lib/types';

interface Props {
  params: { id: string };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function generateMetadata({ params }: Props) {
  try {
    const brief = await fetchBrief(params.id);
    return { title: `${brief.title} — Signals` };
  } catch {
    return { title: 'Brief — Signals' };
  }
}

export default async function BriefPage({ params }: Props) {
  let brief: Brief | undefined;
  try {
    brief = await fetchBrief(params.id);
  } catch {
    notFound();
  }
  if (!brief) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/feeds/${brief.theme}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← {brief.themeLabel}
        </Link>
      </div>

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <ThemeBadge theme={brief.theme} />
          <span className="text-sm text-gray-400">{formatDate(brief.createdAt)}</span>
          {brief.contentType === 'podcast' && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              Podcast
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{brief.title}</h1>
      </header>

      {/* Summary */}
      <div className="bg-indigo-50 border-l-4 border-indigo-400 px-5 py-4 rounded-r-lg mb-8">
        <p className="text-gray-800 leading-relaxed">{brief.summary}</p>
      </div>

      {/* Key Signals */}
      <section className="mb-7">
        <h2 className="font-semibold text-gray-900 text-lg mb-3">Key Signals</h2>
        <ul className="space-y-3">
          {brief.keySignals.map((signal, i) => (
            <li key={i} className="flex gap-3 text-gray-700">
              <span className="text-indigo-400 shrink-0 mt-0.5 font-bold">▸</span>
              <span className="leading-relaxed">{signal}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Decision Implications */}
      <section className="mb-7">
        <h2 className="font-semibold text-gray-900 text-lg mb-3">Decision Implications</h2>
        <ul className="space-y-3">
          {brief.decisionImplications.map((item, i) => (
            <li key={i} className="flex gap-3 text-gray-700">
              <span className="text-amber-500 shrink-0 mt-0.5">◆</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Action Items */}
      <section className="mb-8">
        <h2 className="font-semibold text-gray-900 text-lg mb-3">Action Items</h2>
        <ol className="space-y-3">
          {brief.actionItems.map((action, i) => (
            <li key={i} className="flex gap-3 text-gray-700">
              <span className="font-bold text-indigo-600 shrink-0 w-5 text-right">{i + 1}.</span>
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Source attribution */}
      {brief.sourceName && (
        <div className="border-t border-gray-100 pt-5 mt-8 text-sm text-gray-500">
          <span className="font-medium text-gray-600">Source: </span>
          {brief.sourceUrl ? (
            <a
              href={brief.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              {brief.sourceTitle || brief.sourceName}
            </a>
          ) : (
            <span>{brief.sourceTitle || brief.sourceName}</span>
          )}
          {brief.sourceTitle && brief.sourceName !== brief.sourceTitle && (
            <span className="text-gray-400"> — {brief.sourceName}</span>
          )}
        </div>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link href={`/feeds/${brief.theme}`} className="text-sm text-indigo-600 hover:underline">
          ← More {brief.themeLabel} briefs
        </Link>
      </div>
    </div>
  );
}
