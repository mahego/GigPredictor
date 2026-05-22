const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultRadarRequest, defaultBookingRequest } = require('../src/data/mock-data');
const { getRadarInsights } = require('../src/services/radar-service');
const { recommendBooking } = require('../src/services/booking-service');

test('getRadarInsights returns a regional mexicano-led top for Misantla and Francisco I. Madero', () => {
  const result = getRadarInsights(defaultRadarRequest);

  assert.equal(result.summary.dominant_genre, 'Regional Mexicano');
  assert.equal(result.genre_distribution[0].genre, 'Regional Mexicano');
  assert.equal(result.top_tracks.length, 10);
  assert.equal(result.top_tracks[0].artist.primary, 'Viejones');
  assert.ok(result.top_tracks.some((track) => track.artist.primary === 'Los Únicos de Veracruz'));
  assert.ok(result.area.active_zones.some((zone) => zone.name === 'Francisco I. Madero'));
});

test('recommendBooking returns a top 5 with primary and secondary artist hierarchy', () => {
  const result = recommendBooking(defaultBookingRequest);

  assert.equal(result.recommendations.length, 5);
  assert.equal(result.recommendations[0].artist.primary, 'Viejones');
  assert.equal(result.recommendations[0].artist.secondary, 'DLS');
  assert.ok(result.recommendations.some((artist) => artist.artist.primary === 'Los Únicos de Veracruz'));
  assert.ok(result.recommendations.every((artist) => artist.booking_fee <= defaultBookingRequest.budget));
  assert.ok(result.recommendations.every((artist) => artist.hotspot_focus.length > 0));
});
