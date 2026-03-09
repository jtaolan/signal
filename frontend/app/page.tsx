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

// Curated Unsplash images per theme
const THEME_IMAGES: Record<ThemeKey, string> = {
  accessibility_title2:
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80',
  ai_governance:
    'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
  curriculum_accreditation:
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
  student_success:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
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
    <div className="max-w-3xl mx-auto px-4 py-14">

      {/* Hero */}
      <div className="mb-10 pb-10 border-b border-gray-200">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#ee7012' }}>
          Higher Education Intelligence
        </p>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-3">
          Full-web coverage. 4 decision briefs.
        </h1>
        <p className="text-xl text-gray-500 font-medium mb-6">
          10 minutes to stay ahead.
        </p>
        <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-2xl">
          Every week, we scan hundreds of sources across higher education — RSS feeds, policy
          reports, academic journals, and the full web — and distill them into 4 themed decision
          briefs for academic administrators. No fluff. Just signal.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/subscribe"
            className="text-sm font-bold text-white px-6 py-3 rounded transition-colors"
            style={{ backgroundColor: '#ee7012' }}
          >
            Subscribe — free
          </Link>
          <span className="text-sm text-gray-400">Delivered every Monday morning</span>
        </div>
      </div>

      {/* What we cover */}
      <div className="mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
          What we cover
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const config = THEMES[key];
            const color = THEME_COLORS[config.color] ?? '#ee7012';
            return (
              <Link
                key={key}
                href={`/feeds/${key}`}
                className="group rounded-xl border border-gray-100 hover:border-gray-300 transition-colors overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={THEME_IMAGES[key]}
                    alt={config.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Color overlay bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
                </div>
                {/* Text */}
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 group-hover:underline leading-snug">
                    {config.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
                    {config.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Latest briefs */}
      <div className="mb-6 pb-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Latest Briefs
        </h2>
      </div>

      {(Object.keys(THEMES) as ThemeKey[]).map((theme) => (
        <ThemeFeedSection key={theme} theme={theme} />
      ))}
    </div>
  );
}
