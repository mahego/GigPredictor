const organicSignalSources = [
  {
    zone: 'Misantla Centro',
    lat: 19.9294,
    lng: -96.8514,
    youtubeViews: 24500,
    lastFmListeners: 3900,
    socialMentions: 1320,
    promotionChannels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado']
  },
  {
    zone: 'Francisco I. Madero',
    lat: 19.9218,
    lng: -96.8698,
    youtubeViews: 19100,
    lastFmListeners: 3100,
    socialMentions: 1080,
    promotionChannels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio']
  },
  {
    zone: 'La Constancia',
    lat: 19.9533,
    lng: -96.8372,
    youtubeViews: 16200,
    lastFmListeners: 2400,
    socialMentions: 870,
    promotionChannels: ['Anuncios geolocalizados', 'Radio regional', 'Posters']
  },
  {
    zone: 'Libertad',
    lat: 19.9064,
    lng: -96.8427,
    youtubeViews: 14700,
    lastFmListeners: 2200,
    socialMentions: 790,
    promotionChannels: ['TikTok local', 'Banners en ruta', 'Promotores de calle']
  },
  {
    zone: 'Pueblo Viejo',
    lat: 19.9815,
    lng: -96.8231,
    youtubeViews: 9800,
    lastFmListeners: 1500,
    socialMentions: 430,
    promotionChannels: ['Ferias locales', 'Promoción con comercios']
  }
];

const competitorEvents = [
  {
    name: 'Festival Norteño Misantla 2026',
    genre: 'regional',
    date: '2026-05-23',
    lat: 19.931,
    lng: -96.847,
    expectedAttendance: 1100,
    source: 'Ticketmaster (simulado)'
  },
  {
    name: 'Baile popular San Rafael',
    genre: 'regional',
    date: '2026-05-24',
    lat: 20.189,
    lng: -96.874,
    expectedAttendance: 850,
    source: 'Agenda municipal (simulada)'
  },
  {
    name: 'Muestra cultural jarocha',
    genre: 'folklore',
    date: '2026-05-24',
    lat: 19.936,
    lng: -96.854,
    expectedAttendance: 300,
    source: 'Casa de cultura (simulada)'
  },
  {
    name: 'Noche EDM Martínez',
    genre: 'electronic',
    date: '2026-05-23',
    lat: 20.0705,
    lng: -97.0541,
    expectedAttendance: 600,
    source: 'Promotor privado (simulado)'
  }
];

const defaultAnalysisRequest = {
  artist_name: 'Viejones',
  artist_subtitle: 'DLS',
  genre: 'regional',
  lat: 19.9294,
  lng: -96.8514,
  radius: 18,
  cost_contratacion: 350000,
  date_window: {
    start: '2026-05-23',
    end: '2026-05-24'
  }
};

module.exports = {
  organicSignalSources,
  competitorEvents,
  defaultAnalysisRequest
};
