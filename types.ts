export interface License {
  license_key: string;
  expires_at: string;
  hwid: string | null;
}

export interface SupabaseCredentials {
  url: string;
  key: string;
}
