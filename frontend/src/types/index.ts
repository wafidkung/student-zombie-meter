export interface BiometricFeatures {
  eye_openness: number;
  eye_aspect_ratio: number;
  mouth_aspect_ratio: number;
  under_eye_darkness_ratio: number;
  skin_texture_var: number;
  lighting_condition: 'Well-Lit' | 'Dim-Light' | 'Fluorescent';
  time_slot: 'Daytime' | 'Evening' | 'Overnight';
}

export interface TemporalFeaturesV2 {
  ear_mean: number;
  ear_std: number;
  perclos_score: number;
  blink_rate_bpm: number;
  yawn_frequency: number;
  head_tilt_deg: number;
  under_eye_darkness_ratio: number;
  skin_texture_var: number;
}

export interface PredictionResult {
  status: string;
  engine_version?: string;
  fatigue_score: number;
  alertness_score: number;
  fatigue_level: 'Alert' | 'Tired' | 'Zombie' | string;
  prediction_label: number;
  level_index?: number;
  level_name?: string;
  class_probabilities?: Record<string, number>;
  badge: string;
  summary: string;
  recommendations: string[];
  inference_time_ms: number;
  model_name: string;
  benchmark_metrics?: any;
}

export interface FatigueLog {
  id?: number;
  created_at: string;
  session_id: string;
  eye_openness: number;
  eye_aspect_ratio: number;
  mouth_aspect_ratio: number;
  under_eye_darkness_ratio: number;
  skin_texture_var: number;
  lighting_condition: string;
  time_slot: string;
  fatigue_score: number;
  fatigue_level: string;
  ground_truth_feedback?: string | null;
}
