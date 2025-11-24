import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCredentials } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  return supabaseInstance;
};

export const initSupabase = (creds: SupabaseCredentials): { success: boolean, error?: string } => {
  try {
    if (!creds.url) return { success: false, error: 'Supabase URL is required' };
    if (!creds.key) return { success: false, error: 'Supabase Anon Key is required' };

    // Validate URL format to prevent createClient crash
    try {
      new URL(creds.url);
    } catch (e) {
      return { success: false, error: 'Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.' };
    }

    supabaseInstance = createClient(creds.url, creds.key);
    return { success: true };
  } catch (e: any) {
    console.error("Failed to init supabase", e);
    return { success: false, error: e.message || "Unknown error initializing Supabase" };
  }
};

export const getStoredCredentials = (): SupabaseCredentials | null => {
  const url = localStorage.getItem('sb_url');
  const key = localStorage.getItem('sb_key');
  if (url && key) return { url, key };
  return null;
};

export const saveCredentials = (creds: SupabaseCredentials) => {
  localStorage.setItem('sb_url', creds.url);
  localStorage.setItem('sb_key', creds.key);
};

export const clearCredentials = () => {
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  supabaseInstance = null;
};
