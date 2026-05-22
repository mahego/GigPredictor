'use strict';

/**
 * Unit tests — geo-utils.js
 *
 * Verifies haversine distance calculations used throughout the BI pipeline
 * (zone filtering, competition radius, proximity weighting).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { haversineDistanceKm } = require('../src/services/geo-utils');

// ── Identity ───────────────────────────────────────────────────────────────

test('haversineDistanceKm: same point returns 0', () => {
  const dist = haversineDistanceKm(19.9294, -96.8514, 19.9294, -96.8514);
  assert.equal(dist, 0);
});

// ── Short distances ────────────────────────────────────────────────────────

test('haversineDistanceKm: Misantla Centro → Francisco I. Madero is ~2.3 km', () => {
  // Two neighbouring zones in the default Misantla scenario
  const dist = haversineDistanceKm(
    19.9294, -96.8514, // Misantla Centro
    19.9218, -96.8698  // Francisco I. Madero
  );
  assert.ok(dist > 1.5, `Expected > 1.5 km, got ${dist}`);
  assert.ok(dist < 3.0, `Expected < 3.0 km, got ${dist}`);
});

test('haversineDistanceKm: nearby competitor event near Misantla is within 1 km', () => {
  // Festival Norteño Misantla 2026 sits 200 m from Misantla Centro
  const dist = haversineDistanceKm(
    19.9294, -96.8514,
    19.931,  -96.847
  );
  assert.ok(dist < 1, `Expected < 1 km, got ${dist}`);
});

test('haversineDistanceKm: Misantla → Baile San Rafael is ~29 km (outside 18 km radius)', () => {
  const dist = haversineDistanceKm(
    19.9294, -96.8514,
    20.189,  -96.874
  );
  assert.ok(dist > 18, `Expected outside 18 km radius, got ${dist}`);
  assert.ok(dist < 40, `Expected < 40 km, got ${dist}`);
});

// ── Long distances ─────────────────────────────────────────────────────────

test('haversineDistanceKm: Misantla → Monterrey is ~600–700 km', () => {
  const dist = haversineDistanceKm(
    19.9294, -96.8514,  // Misantla
    25.6866, -100.3161  // Monterrey
  );
  assert.ok(dist > 600, `Expected > 600 km, got ${dist}`);
  assert.ok(dist < 750, `Expected < 750 km, got ${dist}`);
});

test('haversineDistanceKm: Misantla → Cancún is ~1000–1200 km', () => {
  const dist = haversineDistanceKm(
    19.9294, -96.8514,
    21.1619, -86.8515
  );
  assert.ok(dist > 1000, `Expected > 1000 km, got ${dist}`);
  assert.ok(dist < 1250, `Expected < 1250 km, got ${dist}`);
});

// ── Symmetry ───────────────────────────────────────────────────────────────

test('haversineDistanceKm: is symmetric (A→B equals B→A)', () => {
  const ab = haversineDistanceKm(19.9294, -96.8514, 25.6866, -100.3161);
  const ba = haversineDistanceKm(25.6866, -100.3161, 19.9294, -96.8514);
  assert.ok(Math.abs(ab - ba) < 0.0001, `Expected symmetric, got ${ab} vs ${ba}`);
});

// ── Ordering ──────────────────────────────────────────────────────────────

test('haversineDistanceKm: Monterrey is farther from Misantla than Veracruz Puerto', () => {
  const distVeracruz = haversineDistanceKm(19.9294, -96.8514, 19.1738, -96.1342);
  const distMonterrey = haversineDistanceKm(19.9294, -96.8514, 25.6866, -100.3161);
  assert.ok(
    distVeracruz < distMonterrey,
    `Veracruz (${distVeracruz}) should be closer than Monterrey (${distMonterrey})`
  );
});
