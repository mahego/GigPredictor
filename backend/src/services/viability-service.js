const { calculateLocalHeatIndex } = require('./heat-index-service');
const { calculateCompetitionPressure } = require('./competition-service');

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getViabilityLevel(score) {
  if (score >= 55) {
    return 'Alto';
  }

  if (score >= 40) {
    return 'Medio';
  }

  return 'Bajo';
}

function estimateCapacity(localHeatIndex, competitionFactor, cost) {
  const costPressure = Math.round(cost / 40000);
  const viabilityScore = clamp(localHeatIndex - competitionFactor - costPressure + 6, 0, 100);
  const min = Math.max(180, Math.round(viabilityScore * 9 + localHeatIndex * 3.2));
  const max = min + Math.max(120, Math.round(localHeatIndex * 2.5 - competitionFactor * 1.4));

  return {
    viabilityScore,
    aforo_estimado: {
      min,
      max,
      currency: 'MXN',
      estimated_break_even_revenue: cost
    }
  };
}

function analyzeViability(request) {
  const heat = calculateLocalHeatIndex(request);
  const competition = calculateCompetitionPressure(request);
  const { viabilityScore, aforo_estimado } = estimateCapacity(
    heat.local_heat_index,
    competition.competition_factor,
    request.cost_contratacion
  );

  return {
    artist: {
      primary: request.artist_name,
      secondary: request.artist_subtitle
    },
    analysis_area: {
      center: {
        lat: request.lat,
        lng: request.lng
      },
      radius_km: request.radius,
      date_window: request.date_window
    },
    genre: request.genre,
    local_heat_index: heat.local_heat_index,
    competition_factor: competition.competition_factor,
    viability_score: viabilityScore,
    nivel_viabilidad: getViabilityLevel(viabilityScore),
    aforo_estimado,
    puntos_calientes: heat.hotspots.slice(0, 4),
    competing_events: competition.competing_events,
    recommendation: {
      message:
        viabilityScore >= 55
          ? 'Demanda orgánica suficiente para activar campaña táctica en radio local y performance digital.'
          : 'Conviene reforzar inversión promocional y revisar ventana de fechas por presión competitiva.',
      ideal_channels: heat.hotspots[0]?.recommended_channels ?? []
    }
  };
}

module.exports = {
  analyzeViability
};
