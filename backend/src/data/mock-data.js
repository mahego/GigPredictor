const organicSignalSources = [
  {
    zone: 'Misantla Centro',
    lat: 19.9294,
    lng: -96.8514,
    youtubeViews: 24500,
    lastFmListeners: 3900,
    socialMentions: 1320,
    promotionChannels: ['Meta Ads', 'Perifoneo local', 'Carteles en mercado'],
    genreDemand: {
      'Regional Mexicano': 46,
      Cumbia: 16,
      'Pop Latino': 13,
      Banda: 12,
      Urbano: 8,
      Folklore: 5
    }
  },
  {
    zone: 'Francisco I. Madero',
    lat: 19.9218,
    lng: -96.8698,
    youtubeViews: 19100,
    lastFmListeners: 3100,
    socialMentions: 1080,
    promotionChannels: ['Volanteo', 'WhatsApp vecinal', 'Spots en radio'],
    genreDemand: {
      'Regional Mexicano': 44,
      Cumbia: 18,
      'Pop Latino': 12,
      Banda: 11,
      Urbano: 9,
      Folklore: 6
    }
  },
  {
    zone: 'La Constancia',
    lat: 19.9533,
    lng: -96.8372,
    youtubeViews: 16200,
    lastFmListeners: 2400,
    socialMentions: 870,
    promotionChannels: ['Anuncios geolocalizados', 'Radio regional', 'Posters'],
    genreDemand: {
      'Regional Mexicano': 40,
      Cumbia: 17,
      'Pop Latino': 15,
      Banda: 11,
      Urbano: 8,
      Folklore: 9
    }
  },
  {
    zone: 'Libertad',
    lat: 19.9064,
    lng: -96.8427,
    youtubeViews: 14700,
    lastFmListeners: 2200,
    socialMentions: 790,
    promotionChannels: ['TikTok local', 'Banners en ruta', 'Promotores de calle'],
    genreDemand: {
      'Regional Mexicano': 39,
      Cumbia: 19,
      'Pop Latino': 13,
      Banda: 10,
      Urbano: 11,
      Folklore: 8
    }
  },
  {
    zone: 'Pueblo Viejo',
    lat: 19.9815,
    lng: -96.8231,
    youtubeViews: 9800,
    lastFmListeners: 1500,
    socialMentions: 430,
    promotionChannels: ['Ferias locales', 'Promoción con comercios'],
    genreDemand: {
      'Regional Mexicano': 37,
      Cumbia: 16,
      'Pop Latino': 14,
      Banda: 12,
      Urbano: 10,
      Folklore: 11
    }
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

const radarTrackCatalog = [
  {
    title: 'Sueño Norteño',
    artistPrimary: 'Viejones',
    artistSecondary: 'DLS',
    genre: 'Regional Mexicano',
    youtubeViews: 27800,
    lastFmListeners: 3300,
    socialMentions: 1560,
    zoneSupport: {
      'Misantla Centro': 1.25,
      'Francisco I. Madero': 1.22,
      'La Constancia': 1.1,
      Libertad: 1.05,
      'Pueblo Viejo': 0.95
    }
  },
  {
    title: 'Madero en Vivo',
    artistPrimary: 'Los Únicos de Veracruz',
    artistSecondary: '',
    genre: 'Regional Mexicano',
    youtubeViews: 25100,
    lastFmListeners: 3050,
    socialMentions: 1410,
    zoneSupport: {
      'Misantla Centro': 1.12,
      'Francisco I. Madero': 1.28,
      'La Constancia': 1.04,
      Libertad: 1,
      'Pueblo Viejo': 0.9
    }
  },
  {
    title: 'Amanecer Ranchero',
    artistPrimary: 'Grupo Costero',
    artistSecondary: 'Tour 2026',
    genre: 'Regional Mexicano',
    youtubeViews: 22800,
    lastFmListeners: 2780,
    socialMentions: 1240,
    zoneSupport: {
      'Misantla Centro': 1.18,
      'Francisco I. Madero': 1.14,
      'La Constancia': 1.08,
      Libertad: 1.02,
      'Pueblo Viejo': 0.88
    }
  },
  {
    title: 'Ruta 108',
    artistPrimary: 'Banda La Misanteca',
    artistSecondary: '',
    genre: 'Regional Mexicano',
    youtubeViews: 21400,
    lastFmListeners: 2400,
    socialMentions: 980,
    zoneSupport: {
      'Misantla Centro': 1.1,
      'Francisco I. Madero': 1.08,
      'La Constancia': 1.05,
      Libertad: 1,
      'Pueblo Viejo': 0.9
    }
  },
  {
    title: 'Feria y Fogón',
    artistPrimary: 'Los del Valle',
    artistSecondary: '',
    genre: 'Cumbia',
    youtubeViews: 17600,
    lastFmListeners: 1860,
    socialMentions: 860,
    zoneSupport: {
      'Misantla Centro': 1.02,
      'Francisco I. Madero': 1.03,
      'La Constancia': 0.98,
      Libertad: 1.12,
      'Pueblo Viejo': 0.96
    }
  },
  {
    title: 'Noche Tropical',
    artistPrimary: 'Caribe Norte',
    artistSecondary: '',
    genre: 'Cumbia',
    youtubeViews: 16900,
    lastFmListeners: 1750,
    socialMentions: 810,
    zoneSupport: {
      'Misantla Centro': 0.98,
      'Francisco I. Madero': 1.05,
      'La Constancia': 1,
      Libertad: 1.1,
      'Pueblo Viejo': 0.97
    }
  },
  {
    title: 'Latidos del Puerto',
    artistPrimary: 'Mar Abierto',
    artistSecondary: '',
    genre: 'Pop Latino',
    youtubeViews: 15200,
    lastFmListeners: 1600,
    socialMentions: 930,
    zoneSupport: {
      'Misantla Centro': 0.94,
      'Francisco I. Madero': 0.92,
      'La Constancia': 1.1,
      Libertad: 0.96,
      'Pueblo Viejo': 0.95
    }
  },
  {
    title: 'Volando Bajo',
    artistPrimary: 'Luna Clara',
    artistSecondary: '',
    genre: 'Pop Latino',
    youtubeViews: 14500,
    lastFmListeners: 1490,
    socialMentions: 790,
    zoneSupport: {
      'Misantla Centro': 0.92,
      'Francisco I. Madero': 0.91,
      'La Constancia': 1.08,
      Libertad: 0.95,
      'Pueblo Viejo': 0.94
    }
  },
  {
    title: 'Baila en la Plaza',
    artistPrimary: 'Son Jarocho 84',
    artistSecondary: '',
    genre: 'Folklore',
    youtubeViews: 11800,
    lastFmListeners: 1120,
    socialMentions: 610,
    zoneSupport: {
      'Misantla Centro': 0.86,
      'Francisco I. Madero': 0.88,
      'La Constancia': 1.12,
      Libertad: 0.9,
      'Pueblo Viejo': 1.04
    }
  },
  {
    title: 'Perreo en la Sierra',
    artistPrimary: 'DJ Tlapala',
    artistSecondary: '',
    genre: 'Urbano',
    youtubeViews: 13200,
    lastFmListeners: 1010,
    socialMentions: 990,
    zoneSupport: {
      'Misantla Centro': 0.88,
      'Francisco I. Madero': 0.9,
      'La Constancia': 0.92,
      Libertad: 1.08,
      'Pueblo Viejo': 0.98
    }
  }
];

const bookingArtists = [
  {
    primary: 'Viejones',
    secondary: 'DLS',
    genre: 'Regional Mexicano',
    bookingFee: 320000,
    popularityIndex: 95,
    socialPull: 92,
    avgTicketPrice: 480,
    conversionRate: 0.64,
    availableDates: ['2026-05-23', '2026-05-24'],
    hotspotPriorities: {
      'Misantla Centro': 1.28,
      'Francisco I. Madero': 1.24,
      Libertad: 1.08
    }
  },
  {
    primary: 'Los Únicos de Veracruz',
    secondary: '',
    genre: 'Regional Mexicano',
    bookingFee: 280000,
    popularityIndex: 88,
    socialPull: 86,
    avgTicketPrice: 430,
    conversionRate: 0.6,
    availableDates: ['2026-05-23', '2026-05-24'],
    hotspotPriorities: {
      'Francisco I. Madero': 1.26,
      'Misantla Centro': 1.14,
      'La Constancia': 1.02
    }
  },
  {
    primary: 'Grupo Costero',
    secondary: 'Tour 2026',
    genre: 'Regional Mexicano',
    bookingFee: 360000,
    popularityIndex: 83,
    socialPull: 78,
    avgTicketPrice: 410,
    conversionRate: 0.57,
    availableDates: ['2026-05-23', '2026-05-24'],
    hotspotPriorities: {
      'Misantla Centro': 1.18,
      'La Constancia': 1.1,
      Libertad: 1.06
    }
  },
  {
    primary: 'Caribe Norte',
    secondary: '',
    genre: 'Cumbia',
    bookingFee: 220000,
    popularityIndex: 75,
    socialPull: 72,
    avgTicketPrice: 340,
    conversionRate: 0.54,
    availableDates: ['2026-05-23', '2026-05-24'],
    hotspotPriorities: {
      Libertad: 1.16,
      'Francisco I. Madero': 1.08,
      'Pueblo Viejo': 1.04
    }
  },
  {
    primary: 'Mar Abierto',
    secondary: '',
    genre: 'Pop Latino',
    bookingFee: 240000,
    popularityIndex: 73,
    socialPull: 74,
    avgTicketPrice: 350,
    conversionRate: 0.49,
    availableDates: ['2026-05-23', '2026-05-24'],
    hotspotPriorities: {
      'La Constancia': 1.16,
      'Misantla Centro': 1.02,
      'Pueblo Viejo': 0.98
    }
  },
  {
    primary: 'Son Jarocho 84',
    secondary: '',
    genre: 'Folklore',
    bookingFee: 160000,
    popularityIndex: 64,
    socialPull: 61,
    avgTicketPrice: 260,
    conversionRate: 0.46,
    availableDates: ['2026-05-23', '2026-05-24'],
    hotspotPriorities: {
      'La Constancia': 1.15,
      'Pueblo Viejo': 1.09,
      'Misantla Centro': 0.94
    }
  },
  {
    primary: 'DJ Tlapala',
    secondary: '',
    genre: 'Urbano',
    bookingFee: 200000,
    popularityIndex: 70,
    socialPull: 81,
    avgTicketPrice: 300,
    conversionRate: 0.48,
    availableDates: ['2026-05-23', '2026-05-24'],
    hotspotPriorities: {
      Libertad: 1.19,
      'Misantla Centro': 0.96,
      'Francisco I. Madero': 0.94
    }
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

const defaultRadarRequest = {
  lat: 19.9294,
  lng: -96.8514,
  radius: 18
};

const defaultBookingRequest = {
  lat: 19.9294,
  lng: -96.8514,
  radius: 18,
  dates: ['2026-05-23', '2026-05-24'],
  budget: 400000
};

module.exports = {
  organicSignalSources,
  competitorEvents,
  radarTrackCatalog,
  bookingArtists,
  defaultAnalysisRequest,
  defaultRadarRequest,
  defaultBookingRequest
};
