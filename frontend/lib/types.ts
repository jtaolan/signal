export type ThemeKey =
  | 'accessibility_title2'
  | 'ai_governance'
  | 'curriculum_accreditation'
  | 'student_success';

export interface Brief {
  briefId: string;
  theme: ThemeKey;
  themeLabel: string;
  title: string;
  summary: string;
  keySignals: string[];
  decisionImplications: string[];
  actionItems: string[];
  sourceTitle: string;
  sourceName: string;
  sourceUrl: string;
  contentId: string;
  contentType: 'article' | 'podcast';
  published: boolean;
  createdAt: string;
}

export interface FeedsResponse {
  briefs: Brief[];
  cursor: string | null;
  count: number;
}

export interface Source {
  sourceId: string;
  name: string;
  url: string;
  type: 'rss' | 'scrape' | 'podcast';
  theme_hint: string;
  enabled: boolean;
  createdAt: string;
  last_ingested?: string;
}
