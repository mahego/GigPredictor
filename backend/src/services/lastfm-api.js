'use strict';

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0';

async function lastfmGet(params) {
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    throw new Error('LASTFM_API_KEY no está configurado en .env');
  }

  const query = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: 'json'
  });

  const res = await fetch(`${LASTFM_API_BASE}?${query}`);

  if (!res.ok) {
    throw new Error(`Last.fm API error ${res.status}: ${params.method}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }

  return data;
}

/**
 * Top artistas en México según Last.fm.
 * @param {number} limit
 * @returns {Promise<Array<{name: string, listeners: number, playcount: number}>>}
 */
async function getTopArtistsMexico(limit = 20) {
  const data = await lastfmGet({
    method: 'geo.gettopartists',
    country: 'Mexico',
    limit: String(limit)
  });

  return (data.topartists?.artist ?? []).map((artist) => ({
    name: artist.name,
    listeners: parseInt(artist.listeners ?? '0', 10),
    mbid: artist.mbid ?? ''
  }));
}

/**
 * Top tracks en México según Last.fm.
 * @param {number} limit
 * @returns {Promise<Array<{name: string, artist: string, listeners: number, playcount: number}>>}
 */
async function getTopTracksMexico(limit = 30) {
  const data = await lastfmGet({
    method: 'geo.gettoptracks',
    country: 'Mexico',
    limit: String(limit)
  });

  return (data.tracks?.track ?? []).map((track) => ({
    name: track.name,
    artist: track.artist?.name ?? track.artist ?? '',
    listeners: parseInt(track.listeners ?? '0', 10),
    rank: parseInt(track['@attr']?.rank ?? '0', 10)
  }));
}

/**
 * Información de oyentes de un artista específico.
 * @param {string} artistName
 * @returns {Promise<{name: string, listeners: number, playcount: number, tags: string[]}>}
 */
async function getArtistInfo(artistName) {
  const data = await lastfmGet({
    method: 'artist.getinfo',
    artist: artistName,
    autocorrect: '1'
  });

  const artist = data.artist;
  return {
    name: artist.name,
    listeners: parseInt(artist.stats?.listeners ?? '0', 10),
    playcount: parseInt(artist.stats?.playcount ?? '0', 10),
    tags: (artist.tags?.tag ?? []).map((t) => t.name)
  };
}

/**
 * Top tracks de un tag/género específico en Last.fm.
 * @param {string} tag - e.g. 'regional mexican', 'cumbia', 'banda'
 * @param {number} limit
 * @returns {Promise<Array<{name: string, artist: string, listeners: number, genre: string}>>}
 */
async function getTopTracksByTag(tag, limit = 10) {
  const data = await lastfmGet({
    method: 'tag.gettoptracks',
    tag,
    limit: String(limit)
  });

  return (data.tracks?.track ?? []).map((track) => ({
    name: track.name,
    artist: track.artist?.name ?? track.artist ?? '',
    listeners: parseInt(track.listeners ?? track['@attr']?.rank ?? '0', 10),
    rank: parseInt(track['@attr']?.rank ?? '0', 10),
    genre: tag
  }));
}

module.exports = { getTopArtistsMexico, getTopTracksMexico, getTopTracksByTag, getArtistInfo };
