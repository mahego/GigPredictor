const { organicSignalSources, defaultRadarRequest, radarTrackCatalog } = require('../data/mock-data');
const { haversineDistanceKm } = require('./geo-utils');

function round(value) {
  return Math.round(value * 100) / 100;
}

function roundInt(value) {
  return Math.round(value);
}

function getSourceWeight(zone) {
  return zone.youtubeViews / 1200 + zone.lastFmListeners / 95 + zone.socialMentions / 28;
}

function getActiveZones(request = defaultRadarRequest) {
  return organicSignalSources
    .map((zone) => {
      const distanceKm = haversineDistanceKm(request.lat, request.lng, zone.lat, zone.lng);
      if (distanceKm > request.radius) {
        return null;
      }

      const proximityWeight = Math.max(0.4, 1 - distanceKm / (request.radius * 1.15));
      return {
        ...zone,
        distance_km: round(distanceKm),
        demandWeight: round(getSourceWeight(zone) * proximityWeight)
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.demandWeight - left.demandWeight);
}

function buildGenreDistribution(activeZones) {
  const totals = new Map();

  activeZones.forEach((zone) => {
    Object.entries(zone.genreDemand).forEach(([genre, share]) => {
      totals.set(genre, (totals.get(genre) ?? 0) + share * zone.demandWeight);
    });
  });

  const combinedTotal = [...totals.values()].reduce((sum, value) => sum + value, 0) || 1;

  return [...totals.entries()]
    .map(([genre, weightedValue]) => ({
      genre,
      percentage: round((weightedValue / combinedTotal) * 100)
    }))
    .sort((left, right) => right.percentage - left.percentage)
    .map((entry, index, list) =>
      index === list.length - 1
        ? { ...entry, percentage: round(100 - list.slice(0, -1).reduce((sum, item) => sum + item.percentage, 0)) }
        : entry
    );
}

function getGenreBoost(genreDistribution, genre) {
  const match = genreDistribution.find((entry) => entry.genre === genre);
  return 1 + (match?.percentage ?? 0) / 100;
}

function buildTopTracks(activeZones, genreDistribution) {
  return radarTrackCatalog
    .map((track) => {
      const zoneDemand = activeZones.reduce((sum, zone) => {
        return sum + zone.demandWeight * (track.zoneSupport[zone.zone] ?? 0.65);
      }, 0);
      const crossPlatformVolume = track.youtubeViews / 200 + track.lastFmListeners / 18 + track.socialMentions / 12;
      const score = round(crossPlatformVolume * getGenreBoost(genreDistribution, track.genre) + zoneDemand);

      return {
        title: track.title,
        artist: {
          primary: track.artistPrimary,
          secondary: track.artistSecondary
        },
        genre: track.genre,
        score,
        sources: {
          youtube_views: track.youtubeViews,
          lastfm_listeners: track.lastFmListeners,
          social_mentions: track.socialMentions
        }
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 10)
    .map((track, index) => ({
      rank: index + 1,
      ...track,
      trend: index < 4 ? 'Subiendo' : index < 7 ? 'Estable' : 'En observación'
    }));
}

function buildTopArtists(topTracks) {
  const artistMap = new Map();

  topTracks.forEach((track) => {
    const key = `${track.artist.primary}::${track.artist.secondary}`;
    const current = artistMap.get(key) ?? {
      artist: track.artist,
      genre: track.genre,
      score: 0,
      track_count: 0
    };

    current.score += track.score;
    current.track_count += 1;
    artistMap.set(key, current);
  });

  return [...artistMap.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      artist: entry.artist,
      genre: entry.genre,
      score: round(entry.score),
      track_count: entry.track_count
    }));
}

function buildTrendSummary(topTracks) {
  return topTracks.map((track) => ({
    label: `${track.artist.primary}${track.artist.secondary ? ` · ${track.artist.secondary}` : ''}`,
    title: track.title,
    genre: track.genre,
    score: track.score,
    trend: track.trend
  }));
}

function getRadarInsights(request = defaultRadarRequest) {
  const activeZones = getActiveZones(request);
  const genre_distribution = buildGenreDistribution(activeZones);
  const top_tracks = buildTopTracks(activeZones, genre_distribution);
  const top_artists = buildTopArtists(top_tracks);
  const aggregateDemand = activeZones.reduce((sum, zone) => sum + zone.demandWeight, 0);

  return {
    area: {
      center: {
        lat: request.lat,
        lng: request.lng
      },
      radius_km: request.radius,
      lookback_days: 7,
      active_zones: activeZones.map((zone) => ({
        name: zone.zone,
        lat: zone.lat,
        lng: zone.lng,
        distance_km: zone.distance_km,
        demand_weight: zone.demandWeight,
        score: zone.demandWeight,
        recommended_channels: zone.promotionChannels
      }))
    },
    generated_at: '2026-05-22T00:00:00.000Z',
    sources: ['YouTube (simulado)', 'Last.fm (simulado)', 'Social listening (simulado)'],
    summary: {
      local_heat_index: roundInt(Math.min(100, aggregateDemand / Math.max(activeZones.length, 1))),
      dominant_genre: genre_distribution[0]?.genre ?? 'Regional Mexicano',
      dominant_genre_percentage: genre_distribution[0]?.percentage ?? 0
    },
    genre_distribution,
    top_tracks,
    top_artists,
    trends: buildTrendSummary(top_tracks)
  };
}

module.exports = {
  getRadarInsights,
  getActiveZones
};
