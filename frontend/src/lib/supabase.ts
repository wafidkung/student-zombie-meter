import { createClient } from '@supabase/supabase-js';
import type { FatigueLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const backendUrl = import.meta.env.VITE_API_URL || '';

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
      session_id: 'seed-1',
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
      session_id: 'seed-2',
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
      session_id: 'seed-3',
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
      session_id: 'seed-4',
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
      session_id: 'seed-5',
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
      session_id: 'seed-6',
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
  // 1. Primary: Bun SQLite Server (Port 3000 /api/v1/logs)
  try {
    const res = await fetch(`${backendUrl}/api/v1/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        // Also keep local storage synchronized
        const existing = getStoredLogs();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([data, ...existing.filter(l => l.id !== data.id)]));
        return data as FatigueLog;
      }
    }
  } catch (e) {
    console.warn('Bun SQLite insert failed, checking Supabase/LocalStorage:', e);
  }

  // 2. Secondary: Supabase Cloud (if configured)
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

  // 3. Fallback: LocalStorage
  const newRecord: FatigueLog = {
    ...log,
    id: Date.now(),
    created_at: new Date().toISOString()
  };
  const existing = getStoredLogs();
  const updated = [newRecord, ...existing];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return newRecord;
}

export async function fetchFatigueLogs(): Promise<FatigueLog[]> {
  // 1. Primary: Bun SQLite Server (Port 3000 /api/v1/logs)
  try {
    const res = await fetch(`${backendUrl}/api/v1/logs`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data as FatigueLog[];
      }
    }
  } catch (e) {
    console.warn('Bun SQLite fetch failed, checking Supabase/LocalStorage:', e);
  }

  // 2. Secondary: Supabase Cloud (if configured)
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

  // 3. Fallback: LocalStorage
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
  // 1. Primary: Bun SQLite Server
  try {
    await fetch(`${backendUrl}/api/v1/logs/${logId}/feedback`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ground_truth_feedback: feedback })
    });
  } catch (e) {
    console.warn('Bun SQLite feedback update failed:', e);
  }

  // 2. Supabase Cloud (if configured)
  if (isSupabaseConfigured && supabase && typeof logId === 'number') {
    try {
      await supabase.from('fatigue_logs').update({ ground_truth_feedback: feedback }).eq('id', logId);
    } catch (e) {
      console.warn('Supabase update feedback failed:', e);
    }
  }

  // 3. Local storage update
  const logs = getStoredLogs();
  const updated = logs.map(l => l.id === logId ? { ...l, ground_truth_feedback: feedback } : l);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

export async function fetchDatabaseStats() {
  try {
    const res = await fetch(`${backendUrl}/api/v1/stats`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return null;
}
