export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'contentgen-theme';
export const DEFAULT_THEME: ThemeMode = 'dark';

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'dark' || value === 'light';

export const getDocumentTheme = (): ThemeMode => {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const datasetTheme = document.documentElement.getAttribute('data-theme');
  return isThemeMode(datasetTheme) ? datasetTheme : DEFAULT_THEME;
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
};
