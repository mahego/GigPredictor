'use strict';

const { defaultRadarRequest, radarTrackCatalog } = require('../data/mock-data');
const { SocialDataAggregator } = require('./social-data-aggregator');
const { getTopTracksByTag } = require('./lastfm-api');
const { getArtistViewsMexico } = require('./youtube-api');

function round(value) {
  return Math.round(value * 100) / 100;
}

function roundInt(value) {
  return Math.round(value);
}

function getGenreBoost(genreDistribution, genre) {
  const match = genreDistribution.find((entry) => entry.genre === genre);
  return 1 + (match?.percentage ?? 0) / 100;
}

function buildTopTracksFromCatalog(activeZones, genreDistribution, genreFilter = []) {
  const catalog = genreFilter.length > 0
    ? radarTrackCatalog.filter((t) => genreFilter.includes(t.genre))
    : radarTrackCatalog;

  return catalog
    .map((track) => {
      const zoneDemand = activeZones.reduce((sum, zone) => {
        return sum + zone.demandWeight * (track.zoneSupport[zone.zone] ?? 0.65);
      }, 0);
      const crossPlatformVolume = track.youtubeViews / 200 + track.lastFmListeners / 18 + track.socialMentions / 12;
      const score = round(crossPlatformVolume * getGenreBoost(genreDistribution, track.genre) + zoneDemand);

      return {
        title: track.title,
        artist: { primary: track.artistPrimary, secondary: track.artistSecondary },
        genre: track.genre,
        score,
        sources: {
          youtube_views: track.youtubeViews,
          lastfm_listeners: track.lastFmListeners,
          social_mentions: track.socialMentions
        }
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((track, index) => ({
      rank: index + 1,
      ...track,
      trend: index < 4 ? 'Subiendo' : index < 7 ? 'Estable' : 'En observación'
    }));
}

const GENRE_MAP = {
  'Regional Mexicano': 'regional mexican',
  Cumbia: 'cumbia',
  'Pop Latino': 'pop latino',
  Banda: 'banda',
  Urbano: 'urbano latino',
  Folklore: 'folk'
};

async function buildTopTracksFromApis(genreDistribution, genreFilter = []) {
  // Qué géneros consultar: todos o solo los del filtro
  const targetGenres = genreFilter.length > 0
    ? Object.entries(GENRE_MAP).filter(([label]) => genreFilter.includes(label))
    : Object.entries(GENRE_MAP);

  // Obtener top tracks de cada género via Last.fm tags (en paralelo)
  const tagResults = await Promise.allSettled(
    targetGenres.map(([label, tag]) =>
      getTopTracksByTag(tag, 8).then((tracks) => tracks.map((t) => ({ ...t, genreLabel: label })))
    )
  );

  const allTagTracks = tagResults
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  if (allTagTracks.length === 0) {
    throw new Error('No se obtuvieron tracks desde Last.fm tags');
  }

  // Deduplicar por título + artista
  const seen = new Set();
  const uniqueTracks = allTagTracks.filter((t) => {
    const key = `${t.name.toLowerCase()}::${t.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Enriquecer con YouTube si está disponible
  const enriched = await Promise.allSettled(
    uniqueTracks.slice(0, 20).map(async (t) => {
      const youtubeData = await getArtistViewsMexico(t.artist, 2).catch(() => ({ totalViews: 0 }));
      const rankScore = Math.max(1, 10 - (t.rank || 0) + 1);
      const youtubeScore = youtubeData.totalViews / 100000;
      const boost = getGenreBoost(genreDistribution, t.genreLabel);
      const score = round((rankScore * 0.8 + youtubeScore * 0.2) * boost);
      return {
        title: t.name,
        artist: { primary: t.artist, secondary: '' },
        genre: t.genreLabel,
        score,
        sources: { youtube_views: youtubeData.totalViews, lastfm_listeners: 0, social_mentions: 0 }
      };
    })
  );

  return enriched
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((track, index) => ({
      rank: index + 1,
      ...track,
      trend: index < 4 ? 'Subiendo' : index < 7 ? 'Estable' : 'En observación'
    }));
}

async function buildTopTracks(activeZones, genreDistribution, genreFilter = []) {
  if (process.env.LASTFM_API_KEY) {
    try {
      const tracks = await buildTopTracksFromApis(genreDistribution, genreFilter);
      if (tracks.length >= 3) return tracks;
      console.warn('[radar] APIs devolvieron pocos resultados, usando catálogo local');
    } catch (err) {
      console.error('[radar] APIs fallaron, usando catálogo local:', err.message);
    }
  }

  return buildTopTracksFromCatalog(activeZones, genreDistribution, genreFilter);
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

async function getRadarInsights(request = defaultRadarRequest) {
  // Delegate zone detection + genre aggregation to SocialDataAggregator
  const aggregator = new SocialDataAggregator({
    lat: request.lat,
    lng: request.lng,
    radius: request.radius,
  });
  const { activeZones, genreDistribution, baseHeatIndex } = aggregator.aggregate();

  const genreFilter = Array.isArray(request.genres) ? request.genres : [];
  const top_tracks = await buildTopTracks(activeZones, genreDistribution, genreFilter);
  const top_artists = buildTopArtists(top_tracks);

  const usingRealApis = !!process.env.LASTFM_API_KEY;
  const sources = usingRealApis
    ? [
        'Last.fm API',
        ...(process.env.YOUTUBE_API_KEY ? ['YouTube Data API'] : []),
        ...(process.env.SPOTIFY_CLIENT_ID ? ['Spotify Web API'] : []),
      ]
    : ['YouTube (simulado)', 'Last.fm (simulado)', 'Social listening (simulado)'];

  return {
    area: {
      center: { lat: request.lat, lng: request.lng },
      radius_km: request.radius,
      lookback_days: 7,
      active_zones: activeZones.map((zone) => ({
        name: zone.zone,
        lat: zone.lat,
        lng: zone.lng,
        distance_km: zone.distance_km,
        demand_weight: zone.demandWeight,
        score: zone.demandWeight,
        recommended_channels: zone.promotionChannels,
      })),
    },
    generated_at: new Date().toISOString(),
    sources,
    summary: {
      local_heat_index: baseHeatIndex,
      dominant_genre: genreDistribution[0]?.genre ?? 'Regional Mexicano',
      dominant_genre_percentage: genreDistribution[0]?.percentage ?? 0,
    },
    genre_distribution: genreDistribution,
    top_tracks,
    top_artists,
    trends: buildTrendSummary(top_tracks),
  };
}

module.exports = { getRadarInsights };
