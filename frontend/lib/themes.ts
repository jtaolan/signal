import { ThemeKey } from './types';

export const THEMES: Record<
  ThemeKey,
  { label: string; color: string; description: string }
> = {
  accessibility_title2: {
    label: 'Accessibility & Title II',
    color: 'amber',
    description:
      'Policy updates, compliance guidance, and best practices for accessibility and Title II requirements.',
  },
  ai_governance: {
    label: 'AI in Higher Ed Governance',
    color: 'purple',
    description:
      'AI policy, academic integrity rules, data privacy requirements, purchasing and security evaluation trends.',
  },
  curriculum_accreditation: {
    label: 'Curriculum / Accreditation / AoL',
    color: 'blue',
    description:
      'AACSB/ABET/regional accreditation trends, learning outcomes assessment, and program mapping best practices.',
  },
  student_success: {
    label: 'Student Success & Learning Analytics',
    color: 'green',
    description:
      'Student retention strategies, learning analytics, advising interventions, and outcome-driven resources.',
  },
};

export const THEME_COLORS: Record<string, { badge: string; border: string; bg: string }> = {
  amber: {
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-800',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-800',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
  },
  green: {
    badge: 'bg-green-100 text-green-800',
    border: 'border-green-200',
    bg: 'bg-green-50',
  },
};
