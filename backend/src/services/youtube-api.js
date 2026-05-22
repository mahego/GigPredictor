'use strict';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const REGION = 'MX';
const MUSIC_CATEGORY_ID = '10';

async function youtubeGet(path, params) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY no está configurado en .env');
  }

  const query = new URLSearchParams({ ...params, key: apiKey });
  const res = await fetch(`${YOUTUBE_API_BASE}${path}?${query}`);

  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}: ${path}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`YouTube error ${data.error.code}: ${data.error.message}`);
  }

  return data;
}

/**
 * Videos de música más populares en México ahora.
 * @param {number} limit
 * @returns {Promise<Array<{videoId: string, title: string, channelTitle: string, viewCount: number, likeCount: number}>>}
 */
async function getTrendingMusicMexico(limit = 20) {
  const data = await youtubeGet('/videos', {
    part: 'snippet,statistics',
    chart: 'mostPopular',
    regionCode: REGION,
    videoCategoryId: MUSIC_CATEGORY_ID,
    maxResults: String(limit)
  });

  return (data.items ?? []).map((item) => ({
    videoId: item.id,
    title: item.snippet?.title ?? '',
    channelTitle: item.snippet?.channelTitle ?? '',
    publishedAt: item.snippet?.publishedAt ?? '',
    viewCount: parseInt(item.statistics?.viewCount ?? '0', 10),
    likeCount: parseInt(item.statistics?.likeCount ?? '0', 10)
  }));
}

/**
 * Busca videos de un artista en México y retorna métricas de vistas.
 * @param {string} artistName
 * @param {number} limit
 * @returns {Promise<{totalViews: number, topVideoTitle: string, videoCount: number}>}
 */
async function getArtistViewsMexico(artistName, limit = 5) {
  const searchData = await youtubeGet('/search', {
    part: 'id',
    q: artistName,
    type: 'video',
    videoCategoryId: MUSIC_CATEGORY_ID,
    regionCode: REGION,
    maxResults: String(limit),
    order: 'viewCount'
  });

  const videoIds = (searchData.items ?? []).map((item) => item.id?.videoId).filter(Boolean);

  if (videoIds.length === 0) {
    return { totalViews: 0, topVideoTitle: '', videoCount: 0 };
  }

  const statsData = await youtubeGet('/videos', {
    part: 'snippet,statistics',
    id: videoIds.join(',')
  });

  const videos = statsData.items ?? [];
  const totalViews = videos.reduce(
    (sum, v) => sum + parseInt(v.statistics?.viewCount ?? '0', 10),
    0
  );

  return {
    totalViews,
    topVideoTitle: videos[0]?.snippet?.title ?? '',
    videoCount: videos.length
  };
}

module.exports = { getTrendingMusicMexico, getArtistViewsMexico };
