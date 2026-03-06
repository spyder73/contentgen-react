import { AIModel } from './structs';

export const BASE_URL = 'http://localhost:81';

export function constructMediaUrl(filePath: string, cacheBuster?: number): string {
  const url = `${BASE_URL}${filePath}`;
  if (cacheBuster) {
    return `${url}?t=${cacheBuster}`;
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