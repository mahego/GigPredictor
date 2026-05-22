const { bookingArtists, defaultBookingRequest, organicSignalSources } = require('../data/mock-data');
const { getRadarInsights } = require('./radar-service');

function round(value) {
  return Math.round(value * 100) / 100;
}

function normalizeGenre(value) {
  return value.toLowerCase().normalize('NFD').replace(/[^a-z\s]/g, '').trim();
}

function getGenreDemandScore(genreDistribution, artistGenre) {
  const normalizedArtistGenre = normalizeGenre(artistGenre);
  const match = genreDistribution.find((entry) => normalizeGenre(entry.genre) === normalizedArtistGenre);
  return match?.percentage ?? 0;
}

function buildArtistHotspots(artist, activeZones) {
  return activeZones
    .map((zone) => {
      const zoneReference = organicSignalSources.find((entry) => entry.zone === zone.name);
      const affinity = artist.hotspotPriorities[zone.name] ?? 0.82;
      const score = round(zone.demand_weight * affinity);

      return {
        name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        score,
        recommended_channels: zoneReference?.promotionChannels ?? []
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

function isAvailableForDates(artist, dates) {
  return dates.every((date) => artist.availableDates.includes(date));
}

function buildRecommendation(artist, request, radar) {
  const genreDemand = getGenreDemandScore(radar.genre_distribution, artist.genre);
  const hotspots = buildArtistHotspots(artist, radar.area.active_zones);
  const hotspotCoverage = hotspots.reduce((sum, hotspot) => sum + hotspot.score, 0) / Math.max(hotspots.length, 1);
  const budgetEfficiency = Math.max(35, 100 - (artist.bookingFee / request.budget) * 55);
  const radarMomentum = round(radar.summary.local_heat_index * 0.6 + genreDemand * 0.4);
  const roi_score = round(
    artist.popularityIndex * 0.35 +
      genreDemand * 0.25 +
      hotspotCoverage * 0.2 +
      budgetEfficiency * 0.1 +
      artist.socialPull * 0.1
  );
  const projectedAttendance = Math.round(
    radar.summary.local_heat_index * (artist.conversionRate * 7.2) +
      artist.popularityIndex * 5 +
      genreDemand * 4.5 +
      hotspotCoverage * 1.6
  );
  const projectedRevenue = projectedAttendance * artist.avgTicketPrice;
  const projectedProfit = projectedRevenue - artist.bookingFee;

  return {
    artist: {
      primary: artist.primary,
      secondary: artist.secondary
    },
    genre: artist.genre,
    booking_fee: artist.bookingFee,
    popularity_index: artist.popularityIndex,
    radar_momentum: radarMomentum,
    genre_demand: round(genreDemand),
    roi_score,
    projected_attendance: projectedAttendance,
    projected_revenue: projectedRevenue,
    projected_profit: projectedProfit,
    profit_margin: round((projectedProfit / Math.max(projectedRevenue, 1)) * 100),
    hotspot_focus: hotspots,
    reasons: [
      `${artist.genre} con ${round(genreDemand)}% de demanda actual en la zona.`,
      `Costo dentro del presupuesto con fee de ${artist.bookingFee.toLocaleString('es-MX')} MXN.`,
      `Mejor conversión detectada en ${hotspots[0]?.name ?? 'Misantla Centro'}.`
    ]
  };
}

function recommendBooking(request = defaultBookingRequest) {
  const radar = getRadarInsights({ lat: request.lat, lng: request.lng, radius: request.radius });
  const recommendations = bookingArtists
    .filter((artist) => artist.bookingFee <= request.budget)
    .filter((artist) => isAvailableForDates(artist, request.dates))
    .map((artist) => buildRecommendation(artist, request, radar))
    .filter((artist) => artist.projected_profit > 0)
    .sort((left, right) => right.roi_score - left.roi_score)
    .slice(0, 5);

  return {
    area: radar.area,
    requested_dates: request.dates,
    budget: request.budget,
    radar_snapshot: {
      local_heat_index: radar.summary.local_heat_index,
      dominant_genre: radar.summary.dominant_genre,
      dominant_genre_percentage: radar.summary.dominant_genre_percentage
    },
    recommendations,
    selected_artist: recommendations[0] ?? null
  };
}

module.exports = {
  recommendBooking
};
