import { useEffect } from 'react';
import type { ThemePreference } from '@/domain/types';

function resolve(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Writes `data-theme` on <html> and follows the system setting when asked to. */
export function useTheme(preference: ThemePreference): void {
  useEffect(() => {
    const apply = () => {
      const theme = resolve(preference);
      document.documentElement.dataset.theme = theme;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '#0b0f14' : '#ffffff');
    };
    apply();

    if (preference !== 'system' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [preference]);
}
