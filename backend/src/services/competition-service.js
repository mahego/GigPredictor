const { competitorEvents } = require('../data/mock-data');
const { haversineDistanceKm } = require('./geo-utils');

function isWithinDateWindow(date, start, end) {
  return date >= start && date <= end;
}

function genreSimilarity(baseGenre, eventGenre) {
  if (baseGenre === eventGenre) {
    return 1;
  }

  const regionalGenres = new Set(['regional', 'regional mexicano', 'norteno', 'banda']);
  if (regionalGenres.has(baseGenre) && regionalGenres.has(eventGenre)) {
    return 0.85;
  }

  return 0.2;
}

function calculateCompetitionPressure(request) {
  const matchingEvents = competitorEvents
    .map((event) => {
      const distanceKm = haversineDistanceKm(request.lat, request.lng, event.lat, event.lng);
      if (distanceKm > request.radius || !isWithinDateWindow(event.date, request.date_window.start, request.date_window.end)) {
        return null;
      }

      const similarity = genreSimilarity(request.genre.toLowerCase(), event.genre.toLowerCase());
      const proximityWeight = Math.max(0.2, 1 - distanceKm / (request.radius * 1.2));
      const attendanceWeight = event.expectedAttendance / 140;
      const pressure = Math.round(similarity * proximityWeight * attendanceWeight);

      return {
        ...event,
        distance_km: Math.round(distanceKm * 100) / 100,
        pressure
      };
    })
    .filter((event) => Boolean(event) && event.pressure > 0)
    .sort((left, right) => right.pressure - left.pressure);

  const competitionFactor = Math.min(
    35,
    matchingEvents.reduce((sum, event) => sum + event.pressure, 0)
  );

  return {
    competition_factor: competitionFactor,
    competing_events: matchingEvents
  };
}

module.exports = {
  calculateCompetitionPressure
};
