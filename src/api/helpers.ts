import { AIModel } from './structs';

export const BASE_URL = 'http://localhost:81';

export function constructMediaUrl(filePath: string, cacheBuster?: number): string {
  const trimmed = (filePath || '').trim();
  if (!trimmed) return '';

  const isAbsolute =
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:');
  const url = isAbsolute
    ? trimmed
    : `${BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;

  if (cacheBuster) {
    return `${url}${url.includes('?') ? '&' : '?'}t=${cacheBuster}`;
  }
  return url;
}

export function parseUserID(input: string): number {
  const cleaned = input.replace(/\./g, '');
  return parseInt(cleaned, 10);
}

export function supportsImageOutput(model: AIModel): boolean {
  return model.type==="image";
}
