const { organicSignalSources } = require('../data/mock-data');
const { haversineDistanceKm } = require('./geo-utils');

function round(value) {
  return Math.round(value * 100) / 100;
}

function buildZoneHeat(zone, request) {
  const distanceKm = haversineDistanceKm(request.lat, request.lng, zone.lat, zone.lng);
  if (distanceKm > request.radius) {
    return null;
  }

  const proximityWeight = Math.max(0.35, 1 - distanceKm / (request.radius * 1.1));
  const artistBoost = request.artist_name.toLowerCase() === 'grupo firme' ? 1.08 : 1;
  const rawSignal =
    zone.youtubeViews / 900 + zone.lastFmListeners / 70 + zone.socialMentions / 18;
  const score = round(rawSignal * proximityWeight * artistBoost);

  return {
    name: zone.zone,
    lat: zone.lat,
    lng: zone.lng,
    distance_km: round(distanceKm),
    score,
    signal_breakdown: {
      youtube_views: zone.youtubeViews,
      lastfm_listeners: zone.lastFmListeners,
      social_mentions: zone.socialMentions
    },
    recommended_channels: zone.promotionChannels
  };
}

function calculateLocalHeatIndex(request) {
  const hotspots = organicSignalSources
    .map((zone) => buildZoneHeat(zone, request))
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  const totalScore = hotspots.reduce((sum, hotspot) => sum + hotspot.score, 0);
  const normalizedHeatIndex = Math.min(100, round(totalScore / Math.max(hotspots.length, 1)));

  return {
    local_heat_index: normalizedHeatIndex,
    hotspots
  };
}

module.exports = {
  calculateLocalHeatIndex
};
