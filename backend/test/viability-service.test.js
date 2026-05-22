const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultAnalysisRequest } = require('../src/data/mock-data');
const { calculateLocalHeatIndex } = require('../src/services/heat-index-service');
const { calculateCompetitionPressure } = require('../src/services/competition-service');
const { analyzeViability } = require('../src/services/viability-service');

test('calculateLocalHeatIndex returns sorted hotspots inside the requested radius', () => {
  const result = calculateLocalHeatIndex(defaultAnalysisRequest);

  assert.ok(result.local_heat_index > 0);
  // Nationwide zone data yields Misantla Centro + Francisco I. Madero within 18 km
  assert.ok(result.hotspots.length >= 1);
  assert.equal(result.hotspots[0].name, 'Misantla Centro');
  assert.ok(result.hotspots.every((hotspot) => hotspot.distance_km <= defaultAnalysisRequest.radius));
});

test('calculateCompetitionPressure penalizes similar events scheduled on target dates', () => {
  const result = calculateCompetitionPressure(defaultAnalysisRequest);

  assert.ok(result.competition_factor > 0);
  assert.ok(result.competing_events.some((event) => event.genre === 'regional'));
  assert.ok(result.competing_events.every((event) => ['2026-05-23', '2026-05-24'].includes(event.date)));
});

test('analyzeViability returns the requested artist hierarchy and required BI payload', () => {
  const result = analyzeViability(defaultAnalysisRequest);

  assert.equal(result.artist.primary, defaultAnalysisRequest.artist_name);
  assert.equal(result.artist.secondary, defaultAnalysisRequest.artist_subtitle);
  assert.match(result.nivel_viabilidad, /^(Alto|Medio|Bajo)$/);
  assert.ok(result.aforo_estimado.min >= 180);
  assert.ok(result.aforo_estimado.max > result.aforo_estimado.min);
  assert.ok(result.puntos_calientes.length > 0);
  assert.equal(result.puntos_calientes[0].name, 'Misantla Centro');
});
