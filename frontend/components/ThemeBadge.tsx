import { THEMES } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';

const THEME_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#22c55e',
};

export function ThemeBadge({ theme }: { theme: ThemeKey }) {
  const config = THEMES[theme];
  const color = THEME_COLORS[config.color] ?? '#ee7012';
  return (
    <span
      className="text-xs font-semibold uppercase tracking-wide"
      style={{ color }}
    >
      {config.label}
    </span>
  );
}
