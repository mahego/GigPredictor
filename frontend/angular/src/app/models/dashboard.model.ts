export interface MapHotspot {
  name: string;
  lat: number;
  lng: number;
  score: number;
  recommended_channels: string[];
}

export interface ArtistName {
  primary: string;
  secondary: string;
}

export interface RadarRequest {
  lat: number;
  lng: number;
  radius: number;
  genres?: string[];
}

export interface RadarZone extends MapHotspot {
  distance_km: number;
  demand_weight: number;
}

export interface GenreDistribution {
  genre: string;
  percentage: number;
}

export interface RadarTrack {
  rank: number;
  title: string;
  artist: ArtistName;
  genre: string;
  score: number;
  trend: string;
  sources: {
    youtube_views: number;
    lastfm_listeners: number;
    social_mentions: number;
  };
}

export interface RadarTrend {
  label: string;
  title: string;
  genre: string;
  score: number;
  trend: string;
}

export interface RadarResponse {
  area: {
    center: {
      lat: number;
      lng: number;
    };
    radius_km: number;
    lookback_days: number;
    active_zones: RadarZone[];
  };
  generated_at: string;
  sources: string[];
  summary: {
    local_heat_index: number;
    dominant_genre: string;
    dominant_genre_percentage: number;
  };
  genre_distribution: GenreDistribution[];
  top_tracks: RadarTrack[];
  top_artists: Array<{
    rank: number;
    artist: ArtistName;
    genre: string;
    score: number;
    track_count: number;
  }>;
  trends: RadarTrend[];
}

export interface BookingRequest {
  lat: number;
  lng: number;
  radius: number;
  dates: string[];
  budget: number;
}

export interface BookingRecommendation {
  artist: ArtistName;
  genre: string;
  booking_fee: number;
  popularity_index: number;
  radar_momentum: number;
  genre_demand: number;
  roi_score: number;
  projected_attendance: number;
  projected_revenue: number;
  projected_profit: number;
  profit_margin: number;
  hotspot_focus: MapHotspot[];
  reasons: string[];
}

export interface BookingResponse {
  area: RadarResponse['area'];
  requested_dates: string[];
  budget: number;
  radar_snapshot: {
    local_heat_index: number;
    dominant_genre: string;
    dominant_genre_percentage: number;
  };
  recommendations: BookingRecommendation[];
  selected_artist: BookingRecommendation | null;
}
