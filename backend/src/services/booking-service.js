'use strict';

/**
 * Booking ROI Engine — GigPredictor
 *
 * Pipeline:
 *  1. Filter candidates: bookingFee ≤ budget AND artist available on requested dates
 *  2. Run SocialDataAggregator once for the target location
 *  3. For each candidate: compute artist-specific Local Heat Index
 *  4. Apply ROI formula: Rentabilidad = (LocalHeatIndex / BookingFee) × FactorCompetencia × ROI_SCALE
 *  5. Sort by roi_score desc → return Top 5
 */

const { bookingArtists, defaultBookingRequest } = require('../data/mock-data');
const { SocialDataAggregator } = require('./social-data-aggregator');

function round(value) {
  return Math.round(value * 100) / 100;
}

/** Returns true when the artist has at least one slot matching every requested date. */
function isAvailableForDates(artist, dates) {
  if (!dates || dates.length === 0) return true;
  return dates.every((date) => artist.availableDates.includes(date));
}

/**
 * Builds the top hotspot zones relevant to this artist's genre at the target location.
 * Zones are scored by their base demandWeight boosted by the artist's genre share in that zone.
 *
 * @param {object} artist
 * @param {Array} activeZones - from SocialDataAggregator.computeActiveZones()
 * @returns {Array}
 */
function buildArtistHotspots(artist, activeZones) {
  return activeZones
    .map((zone) => {
      const genreShare = zone.genreDemand[artist.genre] ?? 0;
      const score = round(zone.demandWeight * (1 + genreShare / 100));
      return {
        name: zone.zone,
        lat: zone.lat,
        lng: zone.lng,
        score,
        recommended_channels: zone.promotionChannels ?? [],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

/**
 * Builds a full recommendation record for one artist.
 *
 * @param {object} artist           - from bookingArtists catalog
 * @param {object} request          - original booking request
 * @param {object} aggregated       - SocialDataAggregator.aggregate() result
 * @param {object} roiData          - SocialDataAggregator.computeROI() result
 * @returns {object}
 */
function buildRecommendation(artist, request, aggregated, roiData) {
  const { roi_score, localHeat, factorCompetencia } = roiData;

  const genreDemandEntry = aggregated.genreDistribution.find(
    (g) => g.genre === artist.genre
  );
  const genreDemandPct = genreDemandEntry?.percentage ?? 0;

  const hotspots = buildArtistHotspots(artist, aggregated.activeZones);

  // Projected attendance: heat-driven conversion + base popularity signal
  const projectedAttendance = Math.round(
    localHeat * artist.conversionRate * 7.5 +
      artist.popularityIndex * 4.5 +
      artist.socialPull * 2.0
  );
  const projectedRevenue = projectedAttendance * artist.avgTicketPrice;
  const projectedProfit = projectedRevenue - artist.bookingFee;

  const budgetUsagePct = round((artist.bookingFee / request.budget) * 100);

  return {
    artist: { primary: artist.primary, secondary: artist.secondary ?? '' },
    genre: artist.genre,
    booking_fee: artist.bookingFee,
    popularity_index: artist.popularityIndex,
    local_heat_index: localHeat,
    competition_factor: factorCompetencia,
    genre_demand: genreDemandPct,
    roi_score,
    projected_attendance: projectedAttendance,
    projected_revenue: projectedRevenue,
    projected_profit: projectedProfit,
    profit_margin: round((projectedProfit / Math.max(projectedRevenue, 1)) * 100),
    hotspot_focus: hotspots,
    reasons: [
      `Local Heat Index ${localHeat}/100 — demanda orgánica en la zona seleccionada.`,
      `${artist.genre}: ${genreDemandPct}% del consumo local activo.`,
      `Fee $${artist.bookingFee.toLocaleString('es-MX')} MXN (${budgetUsagePct}% del presupuesto).`,
      factorCompetencia < 1.0
        ? `Factor competencia ${factorCompetencia} — eventos del mismo género reducen mercado disponible.`
        : `Sin competencia directa del mismo género en las fechas solicitadas.`,
    ],
  };
}

/**
 * Main booking recommendation function.
 *
 * @param {object} request - { lat, lng, radius, budget, dates[] }
 * @returns {Promise<object>}
 */
async function recommendBooking(request = defaultBookingRequest) {
  // ── Step 1: instantiate the aggregator once for this location ──────────────
  const aggregator = new SocialDataAggregator({
    lat: request.lat,
    lng: request.lng,
    radius: request.radius,
  });

  // ── Step 2: run geographic pipeline (active zones + genre frequencies) ─────
  const aggregated = aggregator.aggregate();

  // ── Step 3: filter catalog by budget and date availability ────────────────
  const candidates = bookingArtists
    .filter((artist) => artist.bookingFee <= request.budget)
    .filter((artist) => isAvailableForDates(artist, request.dates));

  // ── Step 4: score each candidate with the ROI formula ─────────────────────
  //   Rentabilidad = (LocalHeatIndex / BookingFee) × FactorCompetencia × ROI_SCALE
  const scored = candidates.map((artist) => {
    const roiData = aggregator.computeROI(artist, aggregated, request.dates);
    return buildRecommendation(artist, request, aggregated, roiData);
  });

  // ── Step 5: filter unprofitable, sort by ROI, return Top 5 ────────────────
  const recommendations = scored
    .filter((r) => r.projected_profit > 0)
    .sort((a, b) => b.roi_score - a.roi_score)
    .slice(0, 5);

  return {
    area: {
      center: { lat: request.lat, lng: request.lng },
      radius_km: request.radius,
      active_zones: aggregated.activeZones.map((z) => ({
        name: z.zone,
        lat: z.lat,
        lng: z.lng,
        distance_km: z.distance_km,
        demand_weight: z.demandWeight,
        score: z.demandWeight,
        recommended_channels: z.promotionChannels,
      })),
    },
    requested_dates: request.dates,
    budget: request.budget,
    radar_snapshot: {
      local_heat_index: aggregated.baseHeatIndex,
      dominant_genre: aggregated.genreDistribution[0]?.genre ?? 'Regional Mexicano',
      dominant_genre_percentage: aggregated.genreDistribution[0]?.percentage ?? 0,
    },
    recommendations,
    selected_artist: recommendations[0] ?? null,
  };
}

module.exports = { recommendBooking };
