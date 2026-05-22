# GigPredictor

Arquitectura técnica mínima para evaluar la viabilidad comercial de contratar a un artista en una geolocalización específica.

## Estructura de carpetas

```text
/home/runner/work/GigPredictor/GigPredictor
├── backend
│   ├── src
│   │   ├── data/mock-data.js
│   │   ├── services
│   │   │   ├── booking-service.js
│   │   │   ├── competition-service.js
│   │   │   ├── geo-utils.js
│   │   │   ├── heat-index-service.js
│   │   │   ├── radar-service.js
│   │   │   └── viability-service.js
│   │   └── index.js
│   └── test
│       ├── dashboard-service.test.js
│       └── viability-service.test.js
├── frontend
│   ├── angular/src
│   │   ├── app
│   │   │   ├── app.component.ts
│   │   │   ├── app.routes.ts
│   │   │   ├── components/area-insights-map
│   │   │   ├── data
│   │   │   ├── models
│   │   │   ├── pages/booking-dashboard
│   │   │   ├── pages/radar-dashboard
│   │   │   └── services
│   │   └── main.ts
│   └── preview/index.html
├── samples
│   ├── booking-request.json
│   ├── booking-response.json
│   ├── radar-request.json
│   ├── radar-response.json
│   ├── viability-request.json
│   └── viability-response.json
├── schemas
│   ├── booking-request.schema.json
│   ├── booking-response.schema.json
│   ├── radar-request.schema.json
│   ├── radar-response.schema.json
│   ├── viability-request.schema.json
│   └── viability-response.schema.json
└── package.json
```

## Módulo 1: Radar Local

### Qué hace

1. Recibe `lat`, `lng` y `radius`.
2. Simula el cruce de YouTube, Last.fm y social listening para los últimos 7 días.
3. Devuelve el Top 10 de tracks, el ranking de artistas, los porcentajes por género y las zonas calientes.

### Endpoint

`POST /api/radar`

Ejemplo:

```bash
curl -X POST http://localhost:8080/api/radar \
  -H 'Content-Type: application/json' \
  -d '{
    "lat": 19.9294,
    "lng": -96.8514,
    "radius": 18
  }'
```

## Módulo 2: Motor de Recomendación de Booking

### Qué hace

1. Recibe `lat`, `lng`, `radius`, `dates` y `budget`.
2. Filtra una base mockeada de artistas por presupuesto y disponibilidad.
3. Cruza popularidad, momentum local y puntos calientes del Radar para devolver un Top 5 por ROI.

### Endpoint

`POST /api/recommend-booking`

Ejemplo:

```bash
curl -X POST http://localhost:8080/api/recommend-booking \
  -H 'Content-Type: application/json' \
  -d '{
    "lat": 19.9294,
    "lng": -96.8514,
    "radius": 18,
    "dates": ["2026-05-23", "2026-05-24"],
    "budget": 400000
  }'
```

### Contexto mock principal

- Zona de pruebas: Misantla / Francisco I. Madero, Veracruz.
- Fechas de referencia: 23 y 24 de mayo de 2026.
- El Radar lidera con **Regional Mexicano**.
- El Booking incluye a **Viejones** como nombre primario con subtítulo **DLS** y a **Los Únicos de Veracruz**.

## Backend legado: microservicio de viabilidad

### Endpoint principal

`POST /api/viability`

Mantiene el payload histórico para análisis de viabilidad individual.

## Frontend Angular: dashboard

### Layout

- Sidebar con navegación entre `Radar Local` y `Calculadora de Booking`.
- Routing standalone en `/home/runner/work/GigPredictor/GigPredictor/frontend/angular/src/app/app.routes.ts`.
- `AppComponent` como shell principal del dashboard.

### Vista Radar

- Mapa a la izquierda con zonas activas y radio.
- Pie chart con distribución por género.
- Lista Top 10 de tendencias y tabla de artistas líderes.

### Vista Booking

- Formulario para presupuesto, radio y fechas.
- Tabla de resultados ROI con jerarquía `primary` / `secondary`.
- Al seleccionar un artista, el mapa cambia a sus `puntos_calientes`.

## Ejecutar localmente

```bash
cd /home/runner/work/GigPredictor/GigPredictor
npm start
```

## Validación local

```bash
cd /home/runner/work/GigPredictor/GigPredictor
npm test
```
