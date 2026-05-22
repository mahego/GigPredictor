import { BookingResponse } from '../models/dashboard.model';

export const TEST_BOOKING_RESPONSE: BookingResponse = {
  area: {
    center: {
      lat: 19.9294,
      lng: -96.8514
    },
    radius_km: 18,
    lookback_days: 7,
    active_zones: [
      {
        name: 'Misantla Centro',
        lat: 19.9294,
        lng: -96.8514,
        distance_km: 0,
        demand_weight: 108.61,
        score: 108.61,
        recommended_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado']
      },
      {
        name: 'Francisco I. Madero',
        lat: 19.9218,
        lng: -96.8698,
        distance_km: 2.1,
        demand_weight: 78.28,
        score: 78.28,
        recommended_channels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio']
      },
      {
        name: 'La Constancia',
        lat: 19.9533,
        lng: -96.8372,
        distance_km: 3.04,
        demand_weight: 59.57,
        score: 59.57,
        recommended_channels: ['Anuncios geolocalizados', 'Radio regional', 'Posters']
      },
      {
        name: 'Libertad',
        lat: 19.9064,
        lng: -96.8427,
        distance_km: 2.71,
        demand_weight: 55.28,
        score: 55.28,
        recommended_channels: ['TikTok local', 'Banners en ruta', 'Promotores de calle']
      },
      {
        name: 'Pueblo Viejo',
        lat: 19.9815,
        lng: -96.8231,
        distance_km: 6.5,
        demand_weight: 26.96,
        score: 26.96,
        recommended_channels: ['Ferias locales', 'Promoción con comercios']
      }
    ]
  },
  requested_dates: ['2026-05-23', '2026-05-24'],
  budget: 400000,
  radar_snapshot: {
    local_heat_index: 66,
    dominant_genre: 'Regional Mexicano',
    dominant_genre_percentage: 42.52
  },
  recommendations: [
    {
      artist: { primary: 'Viejones', secondary: 'DLS' },
      genre: 'Regional Mexicano',
      booking_fee: 320000,
      popularity_index: 95,
      radar_momentum: 56.61,
      genre_demand: 42.52,
      roi_score: 75.91,
      projected_attendance: 1108,
      projected_revenue: 531840,
      projected_profit: 211840,
      profit_margin: 39.83,
      hotspot_focus: [
        { name: 'Misantla Centro', lat: 19.9294, lng: -96.8514, score: 139.02, recommended_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado'] },
        { name: 'Francisco I. Madero', lat: 19.9218, lng: -96.8698, score: 97.07, recommended_channels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio'] },
        { name: 'Libertad', lat: 19.9064, lng: -96.8427, score: 59.7, recommended_channels: ['TikTok local', 'Banners en ruta', 'Promotores de calle'] },
        { name: 'La Constancia', lat: 19.9533, lng: -96.8372, score: 48.85, recommended_channels: ['Anuncios geolocalizados', 'Radio regional', 'Posters'] }
      ],
      reasons: [
        'Regional Mexicano con 42.52% de demanda actual en la zona.',
        'Costo dentro del presupuesto con fee de 320,000 MXN.',
        'Mejor conversión detectada en Misantla Centro.'
      ]
    },
    {
      artist: { primary: 'Los Únicos de Veracruz', secondary: '' },
      genre: 'Regional Mexicano',
      booking_fee: 280000,
      popularity_index: 88,
      radar_momentum: 56.61,
      genre_demand: 42.52,
      roi_score: 72.61,
      projected_attendance: 1048,
      projected_revenue: 450640,
      projected_profit: 170640,
      profit_margin: 37.87,
      hotspot_focus: [
        { name: 'Misantla Centro', lat: 19.9294, lng: -96.8514, score: 123.82, recommended_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado'] },
        { name: 'Francisco I. Madero', lat: 19.9218, lng: -96.8698, score: 98.63, recommended_channels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio'] },
        { name: 'La Constancia', lat: 19.9533, lng: -96.8372, score: 60.76, recommended_channels: ['Anuncios geolocalizados', 'Radio regional', 'Posters'] },
        { name: 'Libertad', lat: 19.9064, lng: -96.8427, score: 45.33, recommended_channels: ['TikTok local', 'Banners en ruta', 'Promotores de calle'] }
      ],
      reasons: [
        'Regional Mexicano con 42.52% de demanda actual en la zona.',
        'Costo dentro del presupuesto con fee de 280,000 MXN.',
        'Mejor conversión detectada en Misantla Centro.'
      ]
    },
    {
      artist: { primary: 'Grupo Costero', secondary: 'Tour 2026' },
      genre: 'Regional Mexicano',
      booking_fee: 360000,
      popularity_index: 83,
      radar_momentum: 56.61,
      genre_demand: 42.52,
      roi_score: 68.35,
      projected_attendance: 1004,
      projected_revenue: 411640,
      projected_profit: 51640,
      profit_margin: 12.54,
      hotspot_focus: [
        { name: 'Misantla Centro', lat: 19.9294, lng: -96.8514, score: 128.16, recommended_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado'] },
        { name: 'La Constancia', lat: 19.9533, lng: -96.8372, score: 65.53, recommended_channels: ['Anuncios geolocalizados', 'Radio regional', 'Posters'] },
        { name: 'Francisco I. Madero', lat: 19.9218, lng: -96.8698, score: 64.19, recommended_channels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio'] },
        { name: 'Libertad', lat: 19.9064, lng: -96.8427, score: 58.6, recommended_channels: ['TikTok local', 'Banners en ruta', 'Promotores de calle'] }
      ],
      reasons: [
        'Regional Mexicano con 42.52% de demanda actual en la zona.',
        'Costo dentro del presupuesto con fee de 360,000 MXN.',
        'Mejor conversión detectada en Misantla Centro.'
      ]
    },
    {
      artist: { primary: 'Caribe Norte', secondary: '' },
      genre: 'Cumbia',
      booking_fee: 220000,
      popularity_index: 75,
      radar_momentum: 46.46,
      genre_demand: 17.16,
      roi_score: 59.04,
      projected_attendance: 823,
      projected_revenue: 279820,
      projected_profit: 59820,
      profit_margin: 21.38,
      hotspot_focus: [
        { name: 'Misantla Centro', lat: 19.9294, lng: -96.8514, score: 89.06, recommended_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado'] },
        { name: 'Francisco I. Madero', lat: 19.9218, lng: -96.8698, score: 84.54, recommended_channels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio'] },
        { name: 'Libertad', lat: 19.9064, lng: -96.8427, score: 64.12, recommended_channels: ['TikTok local', 'Banners en ruta', 'Promotores de calle'] },
        { name: 'La Constancia', lat: 19.9533, lng: -96.8372, score: 48.85, recommended_channels: ['Anuncios geolocalizados', 'Radio regional', 'Posters'] }
      ],
      reasons: [
        'Cumbia con 17.16% de demanda actual en la zona.',
        'Costo dentro del presupuesto con fee de 220,000 MXN.',
        'Mejor conversión detectada en Misantla Centro.'
      ]
    },
    {
      artist: { primary: 'Mar Abierto', secondary: '' },
      genre: 'Pop Latino',
      booking_fee: 240000,
      popularity_index: 73,
      radar_momentum: 44.88,
      genre_demand: 13.21,
      roi_score: 57.42,
      projected_attendance: 773,
      projected_revenue: 270550,
      projected_profit: 30550,
      profit_margin: 11.29,
      hotspot_focus: [
        { name: 'Misantla Centro', lat: 19.9294, lng: -96.8514, score: 110.78, recommended_channels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado'] },
        { name: 'La Constancia', lat: 19.9533, lng: -96.8372, score: 69.1, recommended_channels: ['Anuncios geolocalizados', 'Radio regional', 'Posters'] },
        { name: 'Francisco I. Madero', lat: 19.9218, lng: -96.8698, score: 64.19, recommended_channels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio'] },
        { name: 'Libertad', lat: 19.9064, lng: -96.8427, score: 45.33, recommended_channels: ['TikTok local', 'Banners en ruta', 'Promotores de calle'] }
      ],
      reasons: [
        'Pop Latino con 13.21% de demanda actual en la zona.',
        'Costo dentro del presupuesto con fee de 240,000 MXN.',
        'Mejor conversión detectada en Misantla Centro.'
      ]
    }
  ],
  selected_artist: null
};

TEST_BOOKING_RESPONSE.selected_artist = TEST_BOOKING_RESPONSE.recommendations[0];
