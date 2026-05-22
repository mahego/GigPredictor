'use strict';

/**
 * Unit tests — SocialDataAggregator
 *
 * Covers every public method of the core BI engine:
 *   computeActiveZones, aggregateGenreFrequencies, computeBaseHeatIndex,
 *   computeArtistLocalHeat, computeCompetitionFactor, computeROI, aggregate.
 *
 * Key invariants verified:
 *   - All filters (radius, date, genre cluster) produce correct output
 *   - Formula weights are applied correctly
 *   - Results vary meaningfully across different Mexican cities
 *   - ROI formula: Rentabilidad = (localHeat / bookingFee) × competencia × ROI_SCALE
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { SocialDataAggregator, ROI_SCALE } = require('../src/services/social-data-aggregator');

// ─── Shared fixtures ───────────────────────────────────────────────────────

// Misantla: 18 km radius — only 2 zones (Misantla Centro + Francisco I. Madero)
const MISANTLA  = { lat: 19.9294, lng: -96.8514, radius: 18 };
// Monterrey: 80 km radius — covers Centro/San Nicolás + San Pedro
const MONTERREY = { lat: 25.6866, lng: -100.3161, radius: 80 };
// Cancún: 80 km radius — Cancún + Mérida region
const CANCUN    = { lat: 21.1619, lng: -86.8515, radius: 80 };
// Oaxaca: 20 km radius — only Oaxaca Ciudad (rich in Folklore)
const OAXACA    = { lat: 17.0732, lng: -96.7266, radius: 20 };
// Remote mid-ocean: no organic signal sources nearby
const OCEANO    = { lat: 10.0, lng: -80.0, radius: 20 };
// Misantla with wider radius to capture competitor events outside 18 km
const MISANTLA_40 = { lat: 19.9294, lng: -96.8514, radius: 40 };
// Misantla with 80 km radius: also captures Xalapa (~43 km)
const MISANTLA_80 = { lat: 19.9294, lng: -96.8514, radius: 80 };

// ─── computeActiveZones ────────────────────────────────────────────────────

test('computeActiveZones: all returned zones are within requested radius', () => {
  const agg = new SocialDataAggregator(MISANTLA);
  const zones = agg.computeActiveZones();
  assert.ok(zones.length > 0, 'Expected at least one active zone');
  zones.forEach((z) =>
    assert.ok(
      z.distance_km <= MISANTLA.radius,
      `Zone "${z.zone}" distance ${z.distance_km} exceeds radius ${MISANTLA.radius}`
    )
  );
});

test('computeActiveZones: wider radius returns more zones than narrower one', () => {
  // 18 km: Misantla Centro + Francisco I. Madero (2 zones)
  // 80 km: also captures Xalapa at ~43 km (3+ zones)
  const narrow = new SocialDataAggregator(MISANTLA).computeActiveZones();
  const wide   = new SocialDataAggregator(MISANTLA_80).computeActiveZones();
  assert.ok(
    wide.length > narrow.length,
    `Wide radius (80 km) should return more zones than narrow (18 km): ${wide.length} vs ${narrow.length}`
  );
});

test('computeActiveZones: zones are sorted by demandWeight descending', () => {
  const zones = new SocialDataAggregator(MONTERREY).computeActiveZones();
  for (let i = 1; i < zones.length; i++) {
    assert.ok(
      zones[i - 1].demandWeight >= zones[i].demandWeight,
      `Zone ${i - 1} demandWeight (${zones[i - 1].demandWeight}) should be ≥ zone ${i} (${zones[i].demandWeight})`
    );
  }
});

test('computeActiveZones: remote location (mid-ocean) returns empty array', () => {
  const zones = new SocialDataAggregator(OCEANO).computeActiveZones();
  assert.equal(zones.length, 0);
});

test('computeActiveZones: each zone exposes demandWeight, distance_km, signalVolume', () => {
  const zones = new SocialDataAggregator(MISANTLA).computeActiveZones();
  zones.forEach((z) => {
    assert.ok(typeof z.demandWeight === 'number' && z.demandWeight > 0, 'demandWeight must be positive');
    assert.ok(typeof z.distance_km === 'number' && z.distance_km >= 0, 'distance_km must be non-negative');
    assert.ok(typeof z.signalVolume === 'number' && z.signalVolume > 0, 'signalVolume must be positive');
  });
});

test('computeActiveZones: Misantla Centro is included in Misantla (18 km)', () => {
  const zones = new SocialDataAggregator(MISANTLA).computeActiveZones();
  const names = zones.map((z) => z.zone);
  assert.ok(names.includes('Misantla Centro'), `Expected Misantla Centro in: ${names}`);
});

test('computeActiveZones: Misantla Centro is NOT included in Monterrey (80 km)', () => {
  const zones = new SocialDataAggregator(MONTERREY).computeActiveZones();
  const names = zones.map((z) => z.zone);
  assert.ok(!names.includes('Misantla Centro'), 'Misantla Centro is >600 km from Monterrey');
});

// ─── aggregateGenreFrequencies ─────────────────────────────────────────────

test('aggregateGenreFrequencies: percentages always sum to 100', () => {
  for (const cfg of [MISANTLA, MONTERREY, CANCUN, OAXACA]) {
    const agg   = new SocialDataAggregator(cfg);
    const zones = agg.computeActiveZones();
    if (zones.length === 0) continue;
    const dist  = agg.aggregateGenreFrequencies(zones);
    const total = dist.reduce((s, g) => s + g.percentage, 0);
    assert.ok(
      Math.abs(total - 100) < 0.1,
      `Genre percentages for ${JSON.stringify(cfg)} sum to ${total}, not 100`
    );
  }
});

test('aggregateGenreFrequencies: genres are sorted by percentage descending', () => {
  const agg   = new SocialDataAggregator(MISANTLA);
  const zones = agg.computeActiveZones();
  const dist  = agg.aggregateGenreFrequencies(zones);
  for (let i = 1; i < dist.length; i++) {
    assert.ok(
      dist[i - 1].percentage >= dist[i].percentage,
      `Genre at index ${i - 1} (${dist[i - 1].percentage}%) should be ≥ index ${i} (${dist[i].percentage}%)`
    );
  }
});

test('aggregateGenreFrequencies: Regional Mexicano is dominant near Misantla', () => {
  const agg   = new SocialDataAggregator(MISANTLA);
  const zones = agg.computeActiveZones();
  const dist  = agg.aggregateGenreFrequencies(zones);
  assert.equal(dist[0].genre, 'Regional Mexicano');
  assert.ok(
    dist[0].percentage > 40,
    `Expected Regional Mexicano > 40% near Misantla, got ${dist[0].percentage}%`
  );
});

test('aggregateGenreFrequencies: Regional Mexicano + Banda dominate near Monterrey', () => {
  const agg   = new SocialDataAggregator(MONTERREY);
  const zones = agg.computeActiveZones();
  const dist  = agg.aggregateGenreFrequencies(zones);
  const bandaEntry = dist.find((g) => g.genre === 'Banda');
  assert.equal(dist[0].genre, 'Regional Mexicano', 'Regional Mexicano should lead in Monterrey');
  assert.ok(bandaEntry, 'Banda must appear in Monterrey distribution');
  assert.ok(
    bandaEntry.percentage > 15,
    `Expected Banda > 15% in Monterrey, got ${bandaEntry.percentage}%`
  );
});

test('aggregateGenreFrequencies: Folklore percentage is higher in Oaxaca than in Monterrey', () => {
  const aggOax = new SocialDataAggregator(OAXACA);
  const aggMty = new SocialDataAggregator(MONTERREY);
  const zonesOax = aggOax.computeActiveZones();
  const zonesMty = aggMty.computeActiveZones();
  const distOax = aggOax.aggregateGenreFrequencies(zonesOax);
  const distMty = aggMty.aggregateGenreFrequencies(zonesMty);
  const folkloreOax = distOax.find((g) => g.genre === 'Folklore')?.percentage ?? 0;
  const folkloreMty = distMty.find((g) => g.genre === 'Folklore')?.percentage ?? 0;
  assert.ok(
    folkloreOax > folkloreMty,
    `Oaxaca Folklore (${folkloreOax}%) should exceed Monterrey (${folkloreMty}%)`
  );
});

test('aggregateGenreFrequencies: genre distributions differ across cities', () => {
  const distMisantla  = (() => { const a = new SocialDataAggregator(MISANTLA);  return a.aggregateGenreFrequencies(a.computeActiveZones()); })();
  const distMonterrey = (() => { const a = new SocialDataAggregator(MONTERREY); return a.aggregateGenreFrequencies(a.computeActiveZones()); })();
  const regionalMisantla  = distMisantla.find((g) => g.genre === 'Regional Mexicano').percentage;
  const regionalMonterrey = distMonterrey.find((g) => g.genre === 'Regional Mexicano').percentage;
  // Misantla is a pure local market; Monterrey has more Banda pulling share away
  assert.notEqual(
    regionalMisantla,
    regionalMonterrey,
    'Regional Mexicano % must differ between Misantla and Monterrey'
  );
});

// ─── computeBaseHeatIndex ─────────────────────────────────────────────────

test('computeBaseHeatIndex: returns 0 for empty zones array', () => {
  const agg = new SocialDataAggregator(OCEANO);
  assert.equal(agg.computeBaseHeatIndex([]), 0);
});

test('computeBaseHeatIndex: result is always between 0 and 100', () => {
  for (const cfg of [MISANTLA, MONTERREY, CANCUN]) {
    const agg   = new SocialDataAggregator(cfg);
    const zones = agg.computeActiveZones();
    const heat  = agg.computeBaseHeatIndex(zones);
    assert.ok(heat >= 0 && heat <= 100, `Heat ${heat} out of [0, 100] for ${JSON.stringify(cfg)}`);
  }
});

test('computeBaseHeatIndex: larger city produces higher or equal heat than rural village', () => {
  const aggMon = new SocialDataAggregator(MONTERREY);
  const aggMis = new SocialDataAggregator(MISANTLA);
  const heatMon = aggMon.computeBaseHeatIndex(aggMon.computeActiveZones());
  const heatMis = aggMis.computeBaseHeatIndex(aggMis.computeActiveZones());
  assert.ok(
    heatMon >= heatMis,
    `Monterrey heat (${heatMon}) should be ≥ Misantla (${heatMis})`
  );
});

// ─── computeArtistLocalHeat ───────────────────────────────────────────────

// Synthetic artist profiles for controlled comparison
const ARTIST_REGIONAL_HIGH  = { genre: 'Regional Mexicano', popularityIndex: 90, socialPull: 85 };
const ARTIST_FOLKLORE_HIGH  = { genre: 'Folklore',          popularityIndex: 90, socialPull: 85 };
const ARTIST_REGIONAL_LOW   = { genre: 'Regional Mexicano', popularityIndex: 30, socialPull: 20 };

test('computeArtistLocalHeat: result is between 0 and 100', () => {
  const agg  = new SocialDataAggregator(MISANTLA);
  const { activeZones, genreDistribution } = agg.aggregate();
  const heat = agg.computeArtistLocalHeat(ARTIST_REGIONAL_HIGH, activeZones, genreDistribution);
  assert.ok(heat >= 0 && heat <= 100, `localHeat ${heat} out of [0, 100]`);
});

test('computeArtistLocalHeat: genre-aligned artist (Regional Mexicano) has higher heat in Misantla than off-genre (Folklore)', () => {
  const agg  = new SocialDataAggregator(MISANTLA);
  const { activeZones, genreDistribution } = agg.aggregate();
  const heatRegional = agg.computeArtistLocalHeat(ARTIST_REGIONAL_HIGH, activeZones, genreDistribution);
  const heatFolklore = agg.computeArtistLocalHeat(ARTIST_FOLKLORE_HIGH, activeZones, genreDistribution);
  assert.ok(
    heatRegional > heatFolklore,
    `Regional (${heatRegional}) should beat Folklore (${heatFolklore}) in Misantla`
  );
});

test('computeArtistLocalHeat: Folklore artist gets higher heat in Oaxaca than in Misantla', () => {
  const aggMis = new SocialDataAggregator(MISANTLA);
  const aggOax = new SocialDataAggregator(OAXACA);
  const aggMisData = aggMis.aggregate();
  const aggOaxData = aggOax.aggregate();
  const heatMis = aggMis.computeArtistLocalHeat(ARTIST_FOLKLORE_HIGH, aggMisData.activeZones, aggMisData.genreDistribution);
  const heatOax = aggOax.computeArtistLocalHeat(ARTIST_FOLKLORE_HIGH, aggOaxData.activeZones, aggOaxData.genreDistribution);
  assert.ok(
    heatOax > heatMis,
    `Folklore heat in Oaxaca (${heatOax}) should exceed Misantla (${heatMis})`
  );
});

test('computeArtistLocalHeat: high-popularity artist scores higher than low-popularity (same genre, location)', () => {
  const agg  = new SocialDataAggregator(MISANTLA);
  const { activeZones, genreDistribution } = agg.aggregate();
  const heatHigh = agg.computeArtistLocalHeat(ARTIST_REGIONAL_HIGH, activeZones, genreDistribution);
  const heatLow  = agg.computeArtistLocalHeat(ARTIST_REGIONAL_LOW,  activeZones, genreDistribution);
  assert.ok(
    heatHigh > heatLow,
    `High-popularity artist (${heatHigh}) should exceed low-popularity (${heatLow})`
  );
});

test('computeArtistLocalHeat: same artist returns different heat in different cities', () => {
  const aggMis = new SocialDataAggregator(MISANTLA);
  const aggMty = new SocialDataAggregator(MONTERREY);
  const dataMis = aggMis.aggregate();
  const dataMty = aggMty.aggregate();
  const heatMis = aggMis.computeArtistLocalHeat(ARTIST_REGIONAL_HIGH, dataMis.activeZones, dataMis.genreDistribution);
  const heatMty = aggMty.computeArtistLocalHeat(ARTIST_REGIONAL_HIGH, dataMty.activeZones, dataMty.genreDistribution);
  assert.notEqual(heatMis, heatMty, 'Local heat must differ between Misantla and Monterrey for the same artist');
});

// ─── computeCompetitionFactor ─────────────────────────────────────────────

test('computeCompetitionFactor: returns 1.0 when there are no competitor events', () => {
  // Remote city: no mock competitor events within radius
  const agg = new SocialDataAggregator(MONTERREY);
  const factor = agg.computeCompetitionFactor(['2026-05-23'], 'Regional Mexicano');
  assert.equal(factor, 1.0);
});

test('computeCompetitionFactor: same-genre competitor near Misantla reduces factor below 1', () => {
  // Festival Norteño Misantla 2026 (genre=regional, date=2026-05-23) sits ~0.2 km away
  const agg = new SocialDataAggregator(MISANTLA_40);
  const factor = agg.computeCompetitionFactor(['2026-05-23'], 'Regional Mexicano');
  assert.ok(factor < 1.0, `Expected factor < 1.0 near Misantla, got ${factor}`);
  assert.ok(factor >= 0.5, `Factor must not go below floor 0.5, got ${factor}`);
});

test('computeCompetitionFactor: Pop Latino has NO competition near Misantla (factor = 1.0)', () => {
  // No competitor events with genre "pop latino" or similar cluster
  const agg = new SocialDataAggregator(MISANTLA_40);
  const factor = agg.computeCompetitionFactor(['2026-05-23', '2026-05-24'], 'Pop Latino');
  assert.equal(factor, 1.0);
});

test('computeCompetitionFactor: Folklore gets reduced on 2026-05-24 near Misantla', () => {
  // Muestra cultural jarocha (genre=folklore, date=2026-05-24, ~0.9 km away)
  const agg = new SocialDataAggregator(MISANTLA_40);
  const factor = agg.computeCompetitionFactor(['2026-05-24'], 'Folklore');
  assert.ok(factor < 1.0, `Expected Folklore factor < 1.0 on 05-24 near Misantla, got ${factor}`);
});

test('computeCompetitionFactor: factor is higher when competing events fall on different dates', () => {
  // On '2026-05-25' there are no registered competitor events
  const agg = new SocialDataAggregator(MISANTLA_40);
  const factorWithConflict    = agg.computeCompetitionFactor(['2026-05-23'], 'Regional Mexicano');
  const factorWithoutConflict = agg.computeCompetitionFactor(['2026-05-25'], 'Regional Mexicano');
  assert.ok(
    factorWithoutConflict > factorWithConflict,
    `Non-conflicting date (${factorWithoutConflict}) should yield higher factor than conflicting (${factorWithConflict})`
  );
});

test('computeCompetitionFactor: competitor outside radius does not reduce factor', () => {
  // Use tiny radius so that competitor events at 0.2+ km are excluded
  const tinyRadius = new SocialDataAggregator({ lat: 19.9294, lng: -96.8514, radius: 0.1 });
  const factor = tinyRadius.computeCompetitionFactor(['2026-05-23'], 'Regional Mexicano');
  assert.equal(factor, 1.0);
});

test('computeCompetitionFactor: multiple competitors reduce factor toward floor 0.5', () => {
  // Both 2026-05-23 (Festival Norteño) and 2026-05-24 (Baile San Rafael at 29 km) match
  // with radius=40, so 2 regional competitors → 1 - 2×0.15 = 0.70
  const agg = new SocialDataAggregator(MISANTLA_40);
  const factor = agg.computeCompetitionFactor(['2026-05-23', '2026-05-24'], 'Regional Mexicano');
  assert.ok(
    factor <= 0.85,
    `Two competitors should push factor ≤ 0.85, got ${factor}`
  );
  assert.ok(factor >= 0.5, `Floor is 0.5, got ${factor}`);
});

test('computeCompetitionFactor: different genre (electronic) does not affect Regional Mexicano factor', () => {
  // Noche EDM Martínez is in the area but genre=electronic, unrelated to regional cluster
  const agg = new SocialDataAggregator(MISANTLA_40);
  const factorRegional   = agg.computeCompetitionFactor(['2026-05-23'], 'Regional Mexicano');
  const factorIfOnlyEDM  = agg.computeCompetitionFactor(['2026-05-23'], 'Urbano');
  // Both are reduced only by events in their own cluster; Urbano and electronic don't cross-penalise Regional
  assert.equal(factorIfOnlyEDM, 1.0, 'Urbano should have no competition on 05-23 near Misantla');
  assert.ok(factorRegional < 1.0, 'Regional Mexicano should still be reduced by Festival Norteño');
});

// ─── computeROI ───────────────────────────────────────────────────────────

const ARTIST_ROI_BASE = {
  genre: 'Regional Mexicano',
  popularityIndex: 70,
  socialPull: 60,
  bookingFee: 200000,
};

test('computeROI: formula Rentabilidad = (localHeat / bookingFee) × competencia × ROI_SCALE', () => {
  const agg       = new SocialDataAggregator(MISANTLA);
  const aggregated = agg.aggregate();
  const result    = agg.computeROI(ARTIST_ROI_BASE, aggregated, []);

  // Verify the exposed formula manually
  const expectedRaw   = (result.localHeat / ARTIST_ROI_BASE.bookingFee) * result.factorCompetencia * ROI_SCALE;
  const expectedScore = Math.min(100, Math.round(expectedRaw * 100) / 100);

  assert.equal(result.roi_score, expectedScore, 'roi_score must match explicit formula');
});

test('computeROI: cheaper fee yields higher ROI (same artist profile, same location)', () => {
  const agg        = new SocialDataAggregator(MISANTLA);
  const aggregated  = agg.aggregate();
  const cheap      = { ...ARTIST_ROI_BASE, bookingFee: 100000 };
  const expensive  = { ...ARTIST_ROI_BASE, bookingFee: 300000 };
  const roiCheap   = agg.computeROI(cheap,    aggregated, []).roi_score;
  const roiExpensive = agg.computeROI(expensive, aggregated, []).roi_score;
  assert.ok(roiCheap > roiExpensive, `Cheap (${roiCheap}) should beat expensive (${roiExpensive})`);
});

test('computeROI: better genre alignment produces higher localHeat and higher ROI', () => {
  const agg        = new SocialDataAggregator(MISANTLA);
  const aggregated  = agg.aggregate();
  const regional   = { ...ARTIST_ROI_BASE, genre: 'Regional Mexicano' }; // dominant in Misantla
  const folklore   = { ...ARTIST_ROI_BASE, genre: 'Folklore'          }; // minor in Misantla
  const roiReg     = agg.computeROI(regional, aggregated, []);
  const roiFolk    = agg.computeROI(folklore,  aggregated, []);
  assert.ok(
    roiReg.localHeat > roiFolk.localHeat,
    `Regional localHeat (${roiReg.localHeat}) should exceed Folklore (${roiFolk.localHeat}) in Misantla`
  );
  assert.ok(
    roiReg.roi_score > roiFolk.roi_score,
    `Regional ROI (${roiReg.roi_score}) should exceed Folklore ROI (${roiFolk.roi_score}) in Misantla`
  );
});

test('computeROI: competition factor reduces ROI when events conflict', () => {
  const agg        = new SocialDataAggregator(MISANTLA_40);
  const aggregated  = agg.aggregate();
  const artist     = { ...ARTIST_ROI_BASE, genre: 'Regional Mexicano' };
  const roiConflict    = agg.computeROI(artist, aggregated, ['2026-05-23']).roi_score;
  const roiNoConflict  = agg.computeROI(artist, aggregated, ['2026-05-25']).roi_score;
  assert.ok(
    roiNoConflict >= roiConflict,
    `ROI without competition (${roiNoConflict}) should be ≥ with competition (${roiConflict})`
  );
});

test('computeROI: roi_score never exceeds 100', () => {
  // Extremely cheap fee to push formula past 100 cap
  const agg        = new SocialDataAggregator(MONTERREY);
  const aggregated  = agg.aggregate();
  const ultraCheap = { genre: 'Regional Mexicano', popularityIndex: 100, socialPull: 100, bookingFee: 1000 };
  const result     = agg.computeROI(ultraCheap, aggregated, []);
  assert.ok(result.roi_score <= 100, `roi_score ${result.roi_score} exceeds 100`);
});

test('computeROI: same artist yields different ROI in different cities', () => {
  const aggMis = new SocialDataAggregator(MISANTLA);
  const aggMty = new SocialDataAggregator(MONTERREY);
  const dataMis = aggMis.aggregate();
  const dataMty = aggMty.aggregate();
  const artist = { ...ARTIST_ROI_BASE };
  const roiMis = aggMis.computeROI(artist, dataMis, []).roi_score;
  const roiMty = aggMty.computeROI(artist, dataMty, []).roi_score;
  assert.notEqual(roiMis, roiMty, 'ROI must differ between Misantla and Monterrey');
});

// ─── aggregate ────────────────────────────────────────────────────────────

test('aggregate: returns activeZones, genreDistribution, baseHeatIndex', () => {
  const result = new SocialDataAggregator(MISANTLA).aggregate();
  assert.ok(Array.isArray(result.activeZones),        'activeZones must be an array');
  assert.ok(Array.isArray(result.genreDistribution),  'genreDistribution must be an array');
  assert.ok(typeof result.baseHeatIndex === 'number', 'baseHeatIndex must be a number');
});

test('aggregate: genreDistribution percentages sum to 100', () => {
  const { genreDistribution } = new SocialDataAggregator(MONTERREY).aggregate();
  const total = genreDistribution.reduce((s, g) => s + g.percentage, 0);
  assert.ok(Math.abs(total - 100) < 0.1, `Sum is ${total}, expected 100`);
});

test('aggregate: activeZones are sorted by demandWeight descending', () => {
  const { activeZones } = new SocialDataAggregator(MONTERREY).aggregate();
  for (let i = 1; i < activeZones.length; i++) {
    assert.ok(
      activeZones[i - 1].demandWeight >= activeZones[i].demandWeight,
      `Zone order violated at index ${i}`
    );
  }
});

test('aggregate: remote location returns empty zones and zero heat', () => {
  const result = new SocialDataAggregator(OCEANO).aggregate();
  assert.equal(result.activeZones.length, 0);
  assert.equal(result.baseHeatIndex, 0);
});
