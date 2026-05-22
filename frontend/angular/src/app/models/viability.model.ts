export interface Hotspot {
  name: string;
  lat: number;
  lng: number;
  score: number;
  recommended_channels: string[];
}

export interface ViabilityResponse {
  artist: {
    primary: string;
    secondary: string;
  };
  analysis_area: {
    center: {
      lat: number;
      lng: number;
    };
    radius_km: number;
    date_window: {
      start: string;
      end: string;
    };
  };
  local_heat_index: number;
  competition_factor: number;
  viability_score: number;
  nivel_viabilidad: 'Alto' | 'Medio' | 'Bajo';
  aforo_estimado: {
    min: number;
    max: number;
    currency: string;
    estimated_break_even_revenue: number;
  };
  puntos_calientes: Hotspot[];
  recommendation: {
    message: string;
    ideal_channels: string[];
  };
}
