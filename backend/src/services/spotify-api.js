'use strict';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const MARKET = 'MX';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET no están configurados en .env');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    throw new Error(`Spotify auth falló: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function spotifyGet(path) {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Spotify API error ${res.status}: ${path}`);
  }

  return res.json();
}

/**
 * Busca artistas populares de un género en México.
 * @param {string} genre - e.g. 'regional mexican', 'cumbia', 'pop latino'
 * @param {number} limit
 * @returns {Promise<Array<{name: string, popularity: number, genres: string[]}>>}
 */
async function searchArtistsByGenre(genre, limit = 10) {
  const query = encodeURIComponent(`genre:"${genre}"`);
  const data = await spotifyGet(
    `/search?q=${query}&type=artist&market=${MARKET}&limit=${limit}`
  );

  return (data.artists?.items ?? [])
    .filter((artist) => artist.popularity > 0)
    .map((artist) => ({
      id: artist.id,
      name: artist.name,
      popularity: artist.popularity,
      genres: artist.genres,
      followers: artist.followers?.total ?? 0
    }));
}

/**
 * Obtiene los top tracks de un artista en México.
 * @param {string} artistId
 * @returns {Promise<Array<{name: string, popularity: number, previewUrl: string|null}>>}
 */
async function getArtistTopTracks(artistId) {
  const data = await spotifyGet(
    `/artists/${artistId}/top-tracks?market=${MARKET}`
  );

  return (data.tracks ?? []).map((track) => ({
    name: track.name,
    popularity: track.popularity,
    previewUrl: track.preview_url ?? null,
    durationMs: track.duration_ms
  }));
}

/**
 * Obtiene los top tracks de varios géneros relevantes para la zona.
 * @returns {Promise<Array>}
 */
async function getTopTracksByGenres() {
  const genres = ['regional mexican', 'cumbia', 'pop latino', 'banda', 'urbano latino'];

  const results = await Promise.allSettled(
    genres.map((genre) => searchArtistsByGenre(genre, 8))
  );

  const artists = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => b.popularity - a.popularity);

  const seen = new Set();
  return artists.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

module.exports = { searchArtistsByGenre, getArtistTopTracks, getTopTracksByGenres };
