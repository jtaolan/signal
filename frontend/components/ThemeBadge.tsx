import clsx from 'clsx';
import { THEMES, THEME_COLORS } from '@/lib/themes';
import { ThemeKey } from '@/lib/types';

export function ThemeBadge({ theme }: { theme: ThemeKey }) {
  const config = THEMES[theme];
  const colors = THEME_COLORS[config.color];
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors.badge,
      )}
    >
      {config.label}
    </span>
  );
}
