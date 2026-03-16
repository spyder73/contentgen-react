import { constructMediaUrl } from '../helpers';

describe('constructMediaUrl', () => {
  it('prefixes relative backend paths with BASE_URL', () => {
    expect(constructMediaUrl('/media/file.png')).toBe('http://localhost:81/media/file.png');
    expect(constructMediaUrl('media/file.png')).toBe('http://localhost:81/media/file.png');
  });

  it('keeps absolute urls unchanged', () => {
    expect(constructMediaUrl('https://cdn.example.com/file.png')).toBe('https://cdn.example.com/file.png');
    expect(constructMediaUrl('http://cdn.example.com/file.png')).toBe('http://cdn.example.com/file.png');
  });
});
