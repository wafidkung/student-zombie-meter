import { createClient } from '@supabase/supabase-js';
import type { FatigueLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fallback in-memory / local storage seed data for demonstration
const LOCAL_STORAGE_KEY = 'zombie_meter_fatigue_logs';

export const getInitialMockLogs = (): FatigueLog[] => {
  const now = new Date();
  return [
    {
      id: 1,
      created_at: new Date(now.getTime() - 6 * 3600000).toISOString(),
      session_id: 'mock-1',
      eye_openness: 0.78,
      eye_aspect_ratio: 0.35,
      mouth_aspect_ratio: 0.18,
      under_eye_darkness_ratio: 0.95,
      skin_texture_var: 0.65,
      lighting_condition: 'Well-Lit',
      time_slot: 'Daytime',
      fatigue_score: 15.5,
      fatigue_level: 'Alert',
      ground_truth_feedback: 'Accurate'
    },
    {
      id: 2,
      created_at: new Date(now.getTime() - 5 * 3600000).toISOString(),
      session_id: 'mock-2',
      eye_openness: 0.72,
      eye_aspect_ratio: 0.33,
      mouth_aspect_ratio: 0.20,
      under_eye_darkness_ratio: 0.92,
      skin_texture_var: 0.60,
      lighting_condition: 'Well-Lit',
      time_slot: 'Daytime',
      fatigue_score: 24.0,
      fatigue_level: 'Alert',
      ground_truth_feedback: 'Accurate'
    },
    {
      id: 3,
      created_at: new Date(now.getTime() - 3 * 3600000).toISOString(),
      session_id: 'mock-3',
      eye_openness: 0.52,
      eye_aspect_ratio: 0.25,
      mouth_aspect_ratio: 0.30,
      under_eye_darkness_ratio: 0.82,
      skin_texture_var: 0.48,
      lighting_condition: 'Fluorescent',
      time_slot: 'Evening',
      fatigue_score: 48.5,
      fatigue_level: 'Tired',
      ground_truth_feedback: 'Accurate'
    },
    {
      id: 4,
      created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
      session_id: 'mock-4',
      eye_openness: 0.45,
      eye_aspect_ratio: 0.21,
      mouth_aspect_ratio: 0.38,
      under_eye_darkness_ratio: 0.75,
      skin_texture_var: 0.42,
      lighting_condition: 'Dim-Light',
      time_slot: 'Evening',
      fatigue_score: 62.0,
      fatigue_level: 'Tired',
      ground_truth_feedback: 'Accurate'
    },
    {
      id: 5,
      created_at: new Date(now.getTime() - 1 * 3600000).toISOString(),
      session_id: 'mock-5',
      eye_openness: 0.22,
      eye_aspect_ratio: 0.14,
      mouth_aspect_ratio: 0.48,
      under_eye_darkness_ratio: 0.65,
      skin_texture_var: 0.31,
      lighting_condition: 'Dim-Light',
      time_slot: 'Overnight',
      fatigue_score: 88.5,
      fatigue_level: 'Zombie',
      ground_truth_feedback: 'Accurate'
    },
    {
      id: 6,
      created_at: now.toISOString(),
      session_id: 'mock-6',
      eye_openness: 0.18,
      eye_aspect_ratio: 0.12,
      mouth_aspect_ratio: 0.55,
      under_eye_darkness_ratio: 0.60,
      skin_texture_var: 0.28,
      lighting_condition: 'Dim-Light',
      time_slot: 'Overnight',
      fatigue_score: 94.0,
      fatigue_level: 'Zombie',
      ground_truth_feedback: 'Accurate'
    }
  ];
};

export async function saveFatigueLog(log: Omit<FatigueLog, 'id' | 'created_at'>): Promise<FatigueLog> {
  const newRecord: FatigueLog = {
    ...log,
    id: Date.now(),
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fatigue_logs')
        .insert([log])
        .select()
        .single();
      if (!error && data) return data as FatigueLog;
    } catch (e) {
      console.warn('Supabase insert failed, saving to localStorage fallback:', e);
    }
  }

  // LocalStorage Fallback
  const existing = getStoredLogs();
  const updated = [newRecord, ...existing];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return newRecord;
}

export async function fetchFatigueLogs(): Promise<FatigueLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fatigue_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) return data as FatigueLog[];
    } catch (e) {
      console.warn('Supabase fetch failed, loading localStorage:', e);
    }
  }

  return getStoredLogs();
}

export function getStoredLogs(): FatigueLog[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    const initial = getInitialMockLogs();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return getInitialMockLogs();
  }
}

export async function updateLogFeedback(logId: number | string, feedback: string) {
  if (isSupabaseConfigured && supabase && typeof logId === 'number') {
    await supabase.from('fatigue_logs').update({ ground_truth_feedback: feedback }).eq('id', logId);
  }
  // Local storage update
  const logs = getStoredLogs();
  const updated = logs.map(l => l.id === logId ? { ...l, ground_truth_feedback: feedback } : l);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}
