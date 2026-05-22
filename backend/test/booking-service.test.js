'use strict';

/**
 * Unit tests — booking-service.js (recommendBooking)
 *
 * Verifies the full booking ROI pipeline:
 *   budget filter → date filter → ROI formula → sort → top-5 slice
 *
 * Key invariants:
 *   - Artists with fee > budget are always excluded
 *   - Artists unavailable on requested dates are always excluded
 *   - Results are sorted by roi_score descending
 *   - All projected_profit > 0 (no loss-making recommendations)
 *   - Response structure is complete and valid
 *   - Results vary meaningfully by city and budget
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { recommendBooking } = require('../src/services/booking-service');
const { bookingArtists } = require('../src/data/mock-data');

// ─── Request builders ──────────────────────────────────────────────────────

const REQ_MISANTLA_STD = {
  lat: 19.9294, lng: -96.8514, radius: 18,
  budget: 400000,
  dates: ['2026-05-23', '2026-05-24'],
};
const REQ_MONTERREY_STD = {
  lat: 25.6866, lng: -100.3161, radius: 80,
  budget: 400000,
  dates: ['2026-05-23', '2026-05-24'],
};
const REQ_CANCUN_STD = {
  lat: 21.1619, lng: -86.8515, radius: 80,
  budget: 400000,
  dates: ['2026-05-23', '2026-05-24'],
};
// High budget: unlocks Banda MS de Sergio Lizárraga (490k) and Jesse & Joy (420k)
const REQ_HIGH_BUDGET_JUNE = {
  lat: 19.9294, lng: -96.8514, radius: 18,
  budget: 600000,
  dates: ['2026-06-13', '2026-06-14'], // Banda MS June slot
};
// Minimal budget: only Son de Madera (75k) and Junior H (85k) fit
const REQ_TINY_BUDGET = {
  lat: 19.9294, lng: -96.8514, radius: 18,
  budget: 90000,
  dates: ['2026-05-23', '2026-05-24'],
};

// ─── Budget filter ─────────────────────────────────────────────────────────

test('recommendBooking: no artist with fee above budget is included', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  result.recommendations.forEach((r) =>
    assert.ok(
      r.booking_fee <= REQ_MISANTLA_STD.budget,
      `Artist "${r.artist.primary}" has fee ${r.booking_fee} > budget ${REQ_MISANTLA_STD.budget}`
    )
  );
});

test('recommendBooking: Banda MS de Sergio Lizárraga is excluded when budget is 400k (fee 490k)', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  const names = result.recommendations.map((r) => r.artist.primary);
  assert.ok(
    !names.includes('Banda MS de Sergio Lizárraga'),
    'Banda MS de Sergio Lizárraga (490k fee) must not appear with 400k budget'
  );
});

test('recommendBooking: Banda MS de Sergio Lizárraga appears when budget is 600k and dates match', async () => {
  const result = await recommendBooking(REQ_HIGH_BUDGET_JUNE);
  const names = result.recommendations.map((r) => r.artist.primary);
  assert.ok(
    names.includes('Banda MS de Sergio Lizárraga'),
    `Banda MS de Sergio Lizárraga should appear with 600k budget on June dates. Got: ${names}`
  );
});

// ─── Date filter ──────────────────────────────────────────────────────────

test('recommendBooking: Banda MS de Sergio Lizárraga excluded for May dates even with 600k budget', async () => {
  const result = await recommendBooking({ ...REQ_MISANTLA_STD, budget: 600000 });
  const names = result.recommendations.map((r) => r.artist.primary);
  // Banda MS de Sergio Lizárraga only has June/July availableDates → excluded by date filter
  assert.ok(
    !names.includes('Banda MS de Sergio Lizárraga'),
    'Banda MS de Sergio Lizárraga must be excluded for May dates regardless of budget'
  );
});

test('recommendBooking: every returned artist is available on ALL requested dates', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  const catalog = Object.fromEntries(
    bookingArtists.map((a) => [a.primary, a.availableDates])
  );
  result.recommendations.forEach((r) => {
    const available = catalog[r.artist.primary];
    assert.ok(available, `Artist "${r.artist.primary}" not found in catalog`);
    REQ_MISANTLA_STD.dates.forEach((date) =>
      assert.ok(
        available.includes(date),
        `Artist "${r.artist.primary}" is not available on ${date}`
      )
    );
  });
});

// ─── ROI sorting and cap ──────────────────────────────────────────────────

test('recommendBooking: results are sorted by roi_score descending', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  for (let i = 1; i < result.recommendations.length; i++) {
    assert.ok(
      result.recommendations[i - 1].roi_score >= result.recommendations[i].roi_score,
      `ROI order violated: index ${i - 1} (${result.recommendations[i - 1].roi_score}) < index ${i} (${result.recommendations[i].roi_score})`
    );
  }
});

test('recommendBooking: returns at most 5 recommendations', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  assert.ok(result.recommendations.length <= 5, `Got ${result.recommendations.length} results, expected ≤ 5`);
});

test('recommendBooking: all roi_scores are between 0 and 100', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  result.recommendations.forEach((r) =>
    assert.ok(
      r.roi_score >= 0 && r.roi_score <= 100,
      `roi_score ${r.roi_score} out of [0, 100] for "${r.artist.primary}"`
    )
  );
});

// ─── Profitability filter ──────────────────────────────────────────────────

test('recommendBooking: all projected_profit values are positive', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  result.recommendations.forEach((r) =>
    assert.ok(
      r.projected_profit > 0,
      `Artist "${r.artist.primary}" has negative profit ${r.projected_profit}`
    )
  );
});

test('recommendBooking: projected_revenue = projected_profit + booking_fee', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  result.recommendations.forEach((r) => {
    const expected = r.projected_revenue - r.booking_fee;
    // Allow small floating-point tolerance
    assert.ok(
      Math.abs(r.projected_profit - expected) < 1,
      `Profit mismatch for "${r.artist.primary}": ${r.projected_profit} ≠ ${expected}`
    );
  });
});

// ─── selected_artist ──────────────────────────────────────────────────────

test('recommendBooking: selected_artist equals the first recommendation', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  assert.deepEqual(
    result.selected_artist.artist,
    result.recommendations[0].artist,
    'selected_artist must be the top-ranked recommendation'
  );
});

test('recommendBooking: selected_artist is null when no candidates exist', async () => {
  // Budget of 0 means no artist can be booked
  const result = await recommendBooking({ ...REQ_MISANTLA_STD, budget: 0 });
  assert.equal(result.selected_artist, null);
  assert.equal(result.recommendations.length, 0);
});

// ─── Response structure ────────────────────────────────────────────────────

test('recommendBooking: response has required top-level keys', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  for (const key of ['area', 'requested_dates', 'budget', 'radar_snapshot', 'recommendations', 'selected_artist']) {
    assert.ok(key in result, `Missing top-level key: ${key}`);
  }
});

test('recommendBooking: radar_snapshot exposes local_heat_index, dominant_genre, dominant_genre_percentage', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  const snap = result.radar_snapshot;
  assert.ok(typeof snap.local_heat_index === 'number' && snap.local_heat_index >= 0);
  assert.ok(typeof snap.dominant_genre === 'string' && snap.dominant_genre.length > 0);
  assert.ok(typeof snap.dominant_genre_percentage === 'number');
});

test('recommendBooking: every recommendation has required fields', async () => {
  const REQUIRED = [
    'artist', 'genre', 'booking_fee', 'popularity_index',
    'local_heat_index', 'competition_factor', 'genre_demand',
    'roi_score', 'projected_attendance', 'projected_revenue',
    'projected_profit', 'profit_margin', 'hotspot_focus', 'reasons',
  ];
  const result = await recommendBooking(REQ_MISANTLA_STD);
  result.recommendations.forEach((r) =>
    REQUIRED.forEach((key) =>
      assert.ok(key in r, `Missing field "${key}" in recommendation for "${r.artist?.primary}"`)
    )
  );
});

test('recommendBooking: hotspot_focus has between 1 and 4 entries', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  result.recommendations.forEach((r) => {
    assert.ok(r.hotspot_focus.length >= 1, `hotspot_focus empty for "${r.artist.primary}"`);
    assert.ok(r.hotspot_focus.length <= 4, `hotspot_focus exceeds 4 for "${r.artist.primary}"`);
  });
});

test('recommendBooking: each reason string is non-empty', async () => {
  const result = await recommendBooking(REQ_MISANTLA_STD);
  result.recommendations.forEach((r) =>
    r.reasons.forEach((reason, i) =>
      assert.ok(typeof reason === 'string' && reason.length > 0, `Reason ${i} is empty for "${r.artist.primary}"`)
    )
  );
});

// ─── Location variation (key BI requirement) ──────────────────────────────

test('recommendBooking: radar snapshot differs between Misantla and Monterrey', async () => {
  const [rMis, rMty] = await Promise.all([
    recommendBooking(REQ_MISANTLA_STD),
    recommendBooking(REQ_MONTERREY_STD),
  ]);
  assert.notEqual(
    rMis.radar_snapshot.local_heat_index,
    rMty.radar_snapshot.local_heat_index,
    'Heat index must differ between Misantla and Monterrey'
  );
});

test('recommendBooking: top artist roi_score differs between Misantla and Monterrey', async () => {
  const [rMis, rMty] = await Promise.all([
    recommendBooking(REQ_MISANTLA_STD),
    recommendBooking(REQ_MONTERREY_STD),
  ]);
  if (rMis.recommendations.length > 0 && rMty.recommendations.length > 0) {
    assert.notEqual(
      rMis.recommendations[0].roi_score,
      rMty.recommendations[0].roi_score,
      'Top ROI score must differ between cities'
    );
  }
});

test('recommendBooking: local_heat_index for same artist differs by city', async () => {
  const [rMis, rCun] = await Promise.all([
    recommendBooking(REQ_MISANTLA_STD),
    recommendBooking(REQ_CANCUN_STD),
  ]);
  // Find a common artist in both result sets
  const mtyNames = new Set(rCun.recommendations.map((r) => r.artist.primary));
  const shared = rMis.recommendations.find((r) => mtyNames.has(r.artist.primary));
  if (shared) {
    const twin = rCun.recommendations.find((r) => r.artist.primary === shared.artist.primary);
    assert.notEqual(
      shared.local_heat_index,
      twin.local_heat_index,
      `local_heat_index for "${shared.artist.primary}" must differ between Misantla and Cancún`
    );
  }
});

test('recommendBooking: fewer recommendations when budget is very small', async () => {
  const [rFull, rTiny] = await Promise.all([
    recommendBooking(REQ_MISANTLA_STD),
    recommendBooking(REQ_TINY_BUDGET),
  ]);
  assert.ok(
    rTiny.recommendations.length < rFull.recommendations.length,
    `Tiny budget should return fewer results (${rTiny.recommendations.length}) than full budget (${rFull.recommendations.length})`
  );
});

test('recommendBooking: area.active_zones is non-empty for all standard cities', async () => {
  for (const req of [REQ_MISANTLA_STD, REQ_MONTERREY_STD, REQ_CANCUN_STD]) {
    const result = await recommendBooking(req);
    assert.ok(
      result.area.active_zones.length > 0,
      `Expected active zones for coords (${req.lat}, ${req.lng})`
    );
  }
});

test('recommendBooking: area.center reflects the requested coordinates', async () => {
  const result = await recommendBooking(REQ_MONTERREY_STD);
  assert.equal(result.area.center.lat, REQ_MONTERREY_STD.lat);
  assert.equal(result.area.center.lng, REQ_MONTERREY_STD.lng);
});
