const http = require('node:http');
const {
  defaultAnalysisRequest,
  defaultRadarRequest,
  defaultBookingRequest
} = require('./data/mock-data');
const { analyzeViability } = require('./services/viability-service');
const { getRadarInsights } = require('./services/radar-service');
const { recommendBooking } = require('./services/booking-service');

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

function collectJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function normalizeDates(dates = []) {
  return [...new Set(dates.filter(Boolean))].sort();
}

function buildRequestPayload(payload = {}) {
  return {
    ...defaultAnalysisRequest,
    ...payload,
    date_window: {
      ...defaultAnalysisRequest.date_window,
      ...(payload.date_window ?? {})
    }
  };
}

function buildRadarRequest(payload = {}) {
  return {
    ...defaultRadarRequest,
    ...payload
  };
}

function buildBookingRequest(payload = {}) {
  return {
    ...defaultBookingRequest,
    ...payload,
    dates: normalizeDates(payload.dates ?? defaultBookingRequest.dates)
  };
}

function createServer() {
  return http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/api/health') {
      sendJson(response, 200, { ok: true, service: 'gigpredictor-viability-engine' });
      return;
    }

    if (request.method === 'POST' && request.url === '/api/viability') {
      try {
        const payload = buildRequestPayload(await collectJsonBody(request));
        sendJson(response, 200, analyzeViability(payload));
      } catch (error) {
        sendJson(response, 400, {
          error: 'Invalid JSON payload',
          detail: error.message
        });
      }
      return;
    }

    if (request.method === 'POST' && request.url === '/api/radar') {
      try {
        const payload = buildRadarRequest(await collectJsonBody(request));
        sendJson(response, 200, getRadarInsights(payload));
      } catch (error) {
        sendJson(response, 400, {
          error: 'Invalid JSON payload',
          detail: error.message
        });
      }
      return;
    }

    if (request.method === 'POST' && request.url === '/api/recommend-booking') {
      try {
        const payload = buildBookingRequest(await collectJsonBody(request));
        sendJson(response, 200, recommendBooking(payload));
      } catch (error) {
        sendJson(response, 400, {
          error: 'Invalid JSON payload',
          detail: error.message
        });
      }
      return;
    }

    sendJson(response, 404, {
      error: 'Route not found',
      available_routes: [
        'GET /api/health',
        'POST /api/viability',
        'POST /api/radar',
        'POST /api/recommend-booking'
      ]
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  createServer().listen(port, () => {
    console.log(`GigPredictor backend listening on http://localhost:${port}`);
  });
}

module.exports = {
  buildRequestPayload,
  buildRadarRequest,
  buildBookingRequest,
  createServer
};
