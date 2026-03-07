export interface AutopostingProperties {
  enabled: boolean;
  posting_frequency?: string;
  daily_posts?: Record<string, number>;
  downtime_hours?: number;
  downtime_start?: string;
  downtime_end?: string;
}

export interface Account {
  _id: string;
  username: string;
  platforms: string[];
  is_ai: boolean;
  autoposting_properties: AutopostingProperties;
  scheduled_times: string[];
}

export interface User {
  id: number;
  username: string;
  accounts: Account[];
}

export interface UsersResponse {
  users: User[];
  active_user: User | null;
}

export interface ScheduleResponse {
  success: boolean;
  run_id?: string;
  status?: string;
  message?: string;
  scheduled_date?: string;
  warnings?: string[];
  error?: string;
}
