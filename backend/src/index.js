const http = require('node:http');
const { defaultAnalysisRequest } = require('./data/mock-data');
const { analyzeViability } = require('./services/viability-service');

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

    sendJson(response, 404, {
      error: 'Route not found',
      available_routes: ['GET /api/health', 'POST /api/viability']
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
  createServer
};
