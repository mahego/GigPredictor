import { ViabilityResponse } from '../models/viability.model';

export const TEST_VIABILITY_RESPONSE: ViabilityResponse = {
  artist: {
    primary: 'Viejones',
    secondary: 'DLS'
  },
  analysis_area: {
    center: {
      lat: 19.9294,
      lng: -96.8514
    },
    radius_km: 18,
    date_window: {
      start: '2026-05-23',
      end: '2026-05-24'
    }
  },
  local_heat_index: 100,
  competition_factor: 8,
  viability_score: 89,
  nivel_viabilidad: 'Alto',
  aforo_estimado: {
    min: 1121,
    max: 1360,
    currency: 'MXN',
    estimated_break_even_revenue: 350000
  },
  puntos_calientes: [
    {
      name: 'Misantla Centro',
      lat: 19.9294,
      lng: -96.8514,
      score: 168.77,
      recommended_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado']
    },
    {
      name: 'Francisco I. Madero',
      lat: 19.9218,
      lng: -96.8698,
      score: 121.17,
      recommended_channels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio']
    },
    {
      name: 'La Constancia',
      lat: 19.9533,
      lng: -96.8372,
      score: 91.96,
      recommended_channels: ['Anuncios geolocalizados', 'Radio regional', 'Posters']
    }
  ],
  recommendation: {
    message: 'Demanda orgánica suficiente para activar campaña táctica en radio local y performance digital.',
    ideal_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado']
  }
};
