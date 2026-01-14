export interface Proxy {
  id: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
  type: 'http' | 'https';
  failure_count: number;
}