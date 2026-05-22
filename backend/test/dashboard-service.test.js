const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultRadarRequest, defaultBookingRequest } = require('../src/data/mock-data');
const { getRadarInsights } = require('../src/services/radar-service');
const { recommendBooking } = require('../src/services/booking-service');

// ─── Radar (getRadarInsights is async — must be awaited) ──────────────────

test('getRadarInsights: Regional Mexicano dominates in Misantla (default request)', async () => {
  const result = await getRadarInsights(defaultRadarRequest);

  assert.equal(result.summary.dominant_genre, 'Regional Mexicano');
  assert.equal(result.genre_distribution[0].genre, 'Regional Mexicano');
});

test('getRadarInsights: returns exactly 10 top tracks from local catalog', async () => {
  const result = await getRadarInsights(defaultRadarRequest);

  assert.equal(result.top_tracks.length, 10);
});

test('getRadarInsights: active zones include Misantla Centro and Francisco I. Madero', async () => {
  const result = await getRadarInsights(defaultRadarRequest);

  const zoneNames = result.area.active_zones.map((z) => z.name);
  assert.ok(zoneNames.includes('Misantla Centro'),       `Misantla Centro missing from: ${zoneNames}`);
  assert.ok(zoneNames.includes('Francisco I. Madero'),   `Francisco I. Madero missing from: ${zoneNames}`);
});

test('getRadarInsights: summary exposes local_heat_index, dominant_genre, dominant_genre_percentage', async () => {
  const result = await getRadarInsights(defaultRadarRequest);

  assert.ok(typeof result.summary.local_heat_index === 'number');
  assert.ok(typeof result.summary.dominant_genre === 'string');
  assert.ok(typeof result.summary.dominant_genre_percentage === 'number');
});

test('getRadarInsights: genre_distribution percentages sum to 100', async () => {
  const result = await getRadarInsights(defaultRadarRequest);

  const total = result.genre_distribution.reduce((s, g) => s + g.percentage, 0);
  assert.ok(Math.abs(total - 100) < 0.1, `Sum is ${total}`);
});

test('getRadarInsights: top_tracks reference Regional Mexicano artists in Misantla', async () => {
  const result = await getRadarInsights(defaultRadarRequest);

  const regionalTracks = result.top_tracks.filter((t) => t.genre === 'Regional Mexicano');
  assert.ok(regionalTracks.length > 0, 'Expected at least one Regional Mexicano track in Misantla');
});

// ─── Booking (recommendBooking is async — must be awaited) ────────────────

test('recommendBooking: returns up to 5 recommendations with artist hierarchy', async () => {
  const result = await recommendBooking(defaultBookingRequest);

  assert.ok(result.recommendations.length > 0, 'Expected at least one recommendation');
  assert.ok(result.recommendations.length <= 5, `Expected ≤ 5, got ${result.recommendations.length}`);
  result.recommendations.forEach((r) => {
    assert.ok(typeof r.artist.primary === 'string' && r.artist.primary.length > 0);
    assert.ok('secondary' in r.artist);
  });
});

test('recommendBooking: all booking_fees are within the requested budget', async () => {
  const result = await recommendBooking(defaultBookingRequest);

  result.recommendations.forEach((r) =>
    assert.ok(
      r.booking_fee <= defaultBookingRequest.budget,
      `Fee ${r.booking_fee} exceeds budget ${defaultBookingRequest.budget}`
    )
  );
});

test('recommendBooking: results are sorted by roi_score descending', async () => {
  const result = await recommendBooking(defaultBookingRequest);

  for (let i = 1; i < result.recommendations.length; i++) {
    assert.ok(
      result.recommendations[i - 1].roi_score >= result.recommendations[i].roi_score,
      `ROI not sorted at index ${i}`
    );
  }
});

test('recommendBooking: every recommendation has hotspot_focus with at least one entry', async () => {
  const result = await recommendBooking(defaultBookingRequest);

  result.recommendations.forEach((r) =>
    assert.ok(r.hotspot_focus.length > 0, `Empty hotspot_focus for "${r.artist.primary}"`)
  );
});

test('recommendBooking: selected_artist is the top-scored recommendation', async () => {
  const result = await recommendBooking(defaultBookingRequest);

  assert.deepEqual(result.selected_artist.artist, result.recommendations[0].artist);
});
