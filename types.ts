import type React from 'react';

export type ToolCategory = 'AI' | 'PDF' | 'Text' | 'Converters' | 'Developer' | 'Utility' | 'Misc' | 'Student' | 'SEO';

export interface Tool {
  path: string;
  name: string;
  description: string;
  category: ToolCategory;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  keywords: string[];
  // FIX: Replaced JSX.Element with React.ReactNode to avoid namespace errors in type-only files.
  icon: React.ReactNode;
}