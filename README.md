# GigPredictor

Arquitectura técnica mínima para evaluar la viabilidad comercial de contratar a un artista en una geolocalización específica.

## Estructura de carpetas

```text
/home/runner/work/GigPredictor/GigPredictor
├── backend
│   ├── src
│   │   ├── data/mock-data.js
│   │   ├── services
│   │   │   ├── competition-service.js
│   │   │   ├── geo-utils.js
│   │   │   ├── heat-index-service.js
│   │   │   └── viability-service.js
│   │   └── index.js
│   └── test/viability-service.test.js
├── frontend
│   ├── angular/src/app
│   │   ├── components/viability-map
│   │   │   ├── viability-map.component.ts
│   │   │   ├── viability-map.component.html
│   │   │   └── viability-map.component.css
│   │   ├── data/test-viability-response.ts
│   │   └── models/viability.model.ts
│   └── preview/index.html
├── schemas
│   ├── viability-request.schema.json
│   └── viability-response.schema.json
├── samples
│   ├── viability-request.json
│   └── viability-response.json
└── package.json
```

## Esquema JSON de entrada

Ver `/home/runner/work/GigPredictor/GigPredictor/schemas/viability-request.schema.json`

Ejemplo:

```json
{
  "artist_name": "Viejones",
  "artist_subtitle": "DLS",
  "genre": "regional",
  "lat": 19.9294,
  "lng": -96.8514,
  "radius": 18,
  "cost_contratacion": 350000,
  "date_window": {
    "start": "2026-05-23",
    "end": "2026-05-24"
  }
}
```

## Esquema JSON de salida

Ver `/home/runner/work/GigPredictor/GigPredictor/schemas/viability-response.schema.json`

Campos clave:

- `artist.primary`: encabezado principal, renderizado como **Viejones**
- `artist.secondary`: subtítulo, renderizado como **DLS**
- `local_heat_index`: índice de calor local calculado con fuentes simuladas
- `competition_factor`: penalización por saturación de eventos similares
- `aforo_estimado`: rango de boletos proyectado
- `puntos_calientes`: colonias/poblados prioritarios para promoción

## Backend: microservicio de viabilidad

### Qué hace

1. Simula señales orgánicas locales (YouTube, Last.fm y menciones sociales).
2. Simula presión competitiva con eventos tipo Ticketmaster/agendas locales.
3. Calcula viabilidad y aforo estimado para conciertos regionales.

### Ejecutar localmente

```bash
cd /home/runner/work/GigPredictor/GigPredictor
npm start
```

### Endpoint principal

`POST /api/viability`

Ejemplo:

```bash
curl -X POST http://localhost:8080/api/viability \
  -H 'Content-Type: application/json' \
  -d '{
    "artist_name": "Viejones",
    "artist_subtitle": "DLS",
    "genre": "regional",
    "lat": 19.9294,
    "lng": -96.8514,
    "radius": 18,
    "cost_contratacion": 350000,
    "date_window": {
      "start": "2026-05-23",
      "end": "2026-05-24"
    }
  }'
```

## Frontend Angular: mapa de calor

El componente base está en:

- `/home/runner/work/GigPredictor/GigPredictor/frontend/angular/src/app/components/viability-map/viability-map.component.ts`
- `/home/runner/work/GigPredictor/GigPredictor/frontend/angular/src/app/components/viability-map/viability-map.component.html`
- `/home/runner/work/GigPredictor/GigPredictor/frontend/angular/src/app/components/viability-map/viability-map.component.css`

Características:

- Renderiza `Viejones` como encabezado principal y `DLS` como subtítulo.
- Dibuja el radio de acción con Google Maps cuando se pasa una API key.
- Activa un modo fallback visual si no existe API key, útil para demos internas.
- Lista los puntos calientes con sus canales promocionales ideales.

## Validación local

### Pruebas backend

```bash
cd /home/runner/work/GigPredictor/GigPredictor
npm test
```

### Vista previa UI para screenshot

Abrir un servidor estático en la raíz del repo y visitar:

- `http://localhost:8000/frontend/preview/index.html`

