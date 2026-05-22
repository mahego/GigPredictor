'use strict';

/**
 * SocialDataAggregator — Core BI engine for GigPredictor.
 *
 * Centralizes geographic signal processing for both the Radar and Booking engines.
 * API stubs (fetchYouTubeData, fetchTicketmasterData) are ready to receive real
 * credentials without modifying any downstream algorithm logic.
 *
 * ROI formula implemented:
 *   Rentabilidad = (LocalHeatIndex / BookingFee) × FactorCompetencia × ROI_SCALE
 */

const { organicSignalSources, competitorEvents } = require('../data/mock-data');
const { haversineDistanceKm } = require('./geo-utils');

function round(value) {
  return Math.round(value * 100) / 100;
}

function normalizeGenre(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim();
}

// Genre similarity map: groups that reduce competition factor together
const GENRE_CLUSTERS = {
  'regional mexicano': ['regional', 'norteno', 'banda', 'regional mexicano'],
  regional: ['regional', 'norteno', 'banda', 'regional mexicano'],
  norteno: ['regional', 'norteno', 'banda', 'regional mexicano'],
  banda: ['regional', 'norteno', 'banda', 'regional mexicano'],
};

// Normalization constant: transforms (localHeat / feeInMXN) to a ~0-100 score.
// Derivation: localHeat ∈ [0,100], fee ∈ [75k,600k] MXN → (100/75000)×ROI_SCALE ≈ 133 max.
const ROI_SCALE = 1e5;

class SocialDataAggregator {
  /**
   * @param {{ lat: number, lng: number, radius: number }} config
   */
  constructor({ lat, lng, radius }) {
    this.lat = lat;
    this.lng = lng;
    this.radius = radius;
  }

  // ─── External API stubs ────────────────────────────────────────────────────
  // These interfaces are stable. Inject real API credentials without
  // touching the ROI / genre aggregation algorithms.

  /**
   * Stub → YouTube Data API v3.
   *
   * Live implementation:
   *   GET https://www.googleapis.com/youtube/v3/search
   *     ?part=snippet&q={artistName}&type=video&regionCode=MX
   *     &maxResults={maxResults}&key={process.env.YOUTUBE_API_KEY}
   *
   * @param {string} artistName
   * @param {number} [maxResults=3]
   * @returns {Promise<{ totalViews: number, videoCount: number, topVideos: Array }>}
   */
  async fetchYouTubeData(artistName, maxResults = 3) { // eslint-disable-line no-unused-vars
    return { totalViews: 0, videoCount: 0, topVideos: [] };
  }

  /**
   * Stub → Ticketmaster Discovery API.
   *
   * Live implementation:
   *   GET https://app.ticketmaster.com/discovery/v2/events.json
   *     ?latlong={this.lat},{this.lng}&radius={this.radius}km&unit=km
   *     &startDateTime={dates[0]}T00:00:00Z&apikey={process.env.TICKETMASTER_API_KEY}
   *
   * @param {string[]} [dates=[]]
   * @returns {Promise<{ events: Array, competitorCount: number }>}
   */
  async fetchTicketmasterData(dates = []) { // eslint-disable-line no-unused-vars
    return { events: [], competitorCount: 0 };
  }

  // ─── Geographic signal processing ─────────────────────────────────────────

  /**
   * Filters organicSignalSources to zones within radius, weighted by proximity
   * and raw signal volume (YouTube + Last.fm + social).
   *
   * @returns {Array} activeZones sorted by demandWeight desc
   */
  computeActiveZones() {
    return organicSignalSources
      .map((zone) => {
        const distanceKm = haversineDistanceKm(this.lat, this.lng, zone.lat, zone.lng);
        if (distanceKm > this.radius) return null;

        // Proximity decay: linear with 1.15× radius buffer
        const proximityWeight = Math.max(0.4, 1 - distanceKm / (this.radius * 1.15));

        // Signal volume: normalized cross-platform sum
        const signalVolume =
          zone.youtubeViews / 1200 +
          zone.lastFmListeners / 95 +
          zone.socialMentions / 28;

        return {
          ...zone,
          distance_km: round(distanceKm),
          proximityWeight,
          signalVolume: round(signalVolume),
          demandWeight: round(signalVolume * proximityWeight),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.demandWeight - a.demandWeight);
  }

  /**
   * Aggregates genre demand percentages across active zones using weighted frequency counting.
   * Each zone contributes its genre shares proportionally to its demandWeight.
   *
   * @param {Array} activeZones
   * @returns {Array<{ genre: string, percentage: number }>} sorted desc
   */
  aggregateGenreFrequencies(activeZones) {
    const totals = new Map();

    activeZones.forEach((zone) => {
      Object.entries(zone.genreDemand).forEach(([genre, share]) => {
        totals.set(genre, (totals.get(genre) ?? 0) + share * zone.demandWeight);
      });
    });

    const totalWeight = [...totals.values()].reduce((s, v) => s + v, 0) || 1;

    const sorted = [...totals.entries()]
      .map(([genre, weighted]) => ({
        genre,
        percentage: round((weighted / totalWeight) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Force percentages to sum to exactly 100 (adjust last entry for rounding)
    const sumHead = sorted.slice(0, -1).reduce((s, e) => s + e.percentage, 0);
    if (sorted.length > 0) {
      sorted[sorted.length - 1].percentage = round(100 - sumHead);
    }

    return sorted;
  }

  /**
   * Base heat index for the geographic area (0-100).
   * Represents aggregate social signal strength regardless of artist.
   *
   * @param {Array} activeZones
   * @returns {number}
   */
  computeBaseHeatIndex(activeZones) {
    if (activeZones.length === 0) return 0;
    const aggregateDemand = activeZones.reduce((s, z) => s + z.demandWeight, 0);
    return Math.min(100, Math.round(aggregateDemand / activeZones.length));
  }

  // ─── Artist-specific metrics ───────────────────────────────────────────────

  /**
   * Local Heat Index for a specific artist at these coordinates.
   *
   * Weighted formula:
   *   artistLocalHeat = baseAreaHeat   × 0.35   (market activity at location)
   *                   + genreDemandPct × 0.40   (% of artist's genre in this market)
   *                   + popularityIdx  × 0.15   (national artist popularity)
   *                   + socialPull     × 0.10   (social media momentum)
   *
   * This is the "Local Heat Index" fed into the ROI formula.
   *
   * @param {{ genre: string, popularityIndex: number, socialPull: number }} artist
   * @param {Array} activeZones
   * @param {Array} genreDistribution
   * @returns {number} 0-100
   */
  computeArtistLocalHeat(artist, activeZones, genreDistribution) {
    const baseAreaHeat = this.computeBaseHeatIndex(activeZones);
    const genreMatch = genreDistribution.find(
      (g) => normalizeGenre(g.genre) === normalizeGenre(artist.genre)
    );
    const genreDemandPct = genreMatch?.percentage ?? 0;

    return Math.min(
      100,
      round(
        baseAreaHeat * 0.35 +
          genreDemandPct * 0.40 +
          artist.popularityIndex * 0.15 +
          artist.socialPull * 0.10
      )
    );
  }

  /**
   * Competition pressure factor for a given artist genre on specific dates.
   *
   * Starts at 1.0; each same-genre competitor event in radius on the same date
   * reduces the factor by 0.15. Floor: 0.5 (market saturation cap).
   *
   * In the future this will call fetchTicketmasterData() to get live competitor data.
   *
   * @param {string[]} dates
   * @param {string} artistGenre
   * @returns {number} 0.5–1.0
   */
  computeCompetitionFactor(dates, artistGenre) {
    const normalizedArtist = normalizeGenre(artistGenre);
    const artistCluster = GENRE_CLUSTERS[normalizedArtist] ?? [normalizedArtist];

    const overlapping = competitorEvents.filter((event) => {
      const dist = haversineDistanceKm(this.lat, this.lng, event.lat, event.lng);
      const dateOverlap = dates.length === 0 || dates.some((d) => d === event.date);
      const genreOverlap = artistCluster.includes(normalizeGenre(event.genre));
      return dist <= this.radius && dateOverlap && genreOverlap;
    });

    return Math.max(0.5, round(1.0 - overlapping.length * 0.15));
  }

  // ─── Full pipeline ─────────────────────────────────────────────────────────

  /**
   * Runs the full geographic aggregation pipeline.
   * Called once per booking/radar request; results are shared across all artist comparisons.
   *
   * @returns {{ activeZones: Array, genreDistribution: Array, baseHeatIndex: number }}
   */
  aggregate() {
    const activeZones = this.computeActiveZones();
    const genreDistribution = this.aggregateGenreFrequencies(activeZones);
    const baseHeatIndex = this.computeBaseHeatIndex(activeZones);
    return { activeZones, genreDistribution, baseHeatIndex };
  }

  /**
   * Full ROI computation for one artist at this location.
   *
   * Formula: Rentabilidad = (LocalHeatIndex / BookingFee) × FactorCompetencia × ROI_SCALE
   *
   * @param {{ genre: string, popularityIndex: number, socialPull: number, bookingFee: number }} artist
   * @param {{ activeZones: Array, genreDistribution: Array }} aggregated - from aggregate()
   * @param {string[]} dates
   * @returns {{ roi_score: number, localHeat: number, factorCompetencia: number }}
   */
  computeROI(artist, aggregated, dates) {
    const localHeat = this.computeArtistLocalHeat(
      artist,
      aggregated.activeZones,
      aggregated.genreDistribution
    );
    const factorCompetencia = this.computeCompetitionFactor(dates, artist.genre);
    const raw = (localHeat / artist.bookingFee) * factorCompetencia * ROI_SCALE;

    return {
      roi_score: Math.min(100, round(raw)),
      localHeat,
      factorCompetencia,
    };
  }
}

module.exports = { SocialDataAggregator, ROI_SCALE };
