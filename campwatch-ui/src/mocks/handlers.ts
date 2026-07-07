/**
 * MSW request handlers — intercept all API calls when VITE_MOCK_API=true.
 * No backend required. Data lives in ./data.ts.
 */
import { http, HttpResponse } from 'msw';
import {
  MOCK_CAMPSITES,
  MOCK_CAMPGROUND_SEEDS,
  MOCK_OUTINGS,
  MOCK_REC_AREA_SEEDS,
  MOCK_TRIPS,
} from './data';

// In-memory stores so POST/PUT/DELETE feel live during the demo session.
let trips = [...MOCK_TRIPS];
let outings = [...MOCK_OUTINGS];
let nextTripId = trips.length + 1;
let nextOutingId = outings.length + 1;

// Simulate a brief network delay (ms) so loading states are visible.
const DELAY = 400;
const delay = (ms = DELAY) => new Promise(r => setTimeout(r, ms));

export const handlers = [

  // ── Trips ──────────────────────────────────────────────────────────────────

  http.get('/api/trips', async () => {
    await delay();
    return HttpResponse.json(trips);
  }),

  http.post('/api/trips', async ({ request }) => {
    await delay();
    const body = await request.json() as Record<string, unknown>;
    const trip = { id: nextTripId++, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
    trips = [...trips, trip as typeof MOCK_TRIPS[0]];
    return HttpResponse.json(trip, { status: 201 });
  }),

  http.put('/api/trips/:id', async ({ request, params }) => {
    await delay();
    const id = Number(params.id);
    const body = await request.json() as Record<string, unknown>;
    trips = trips.map(t => t.id === id ? { ...t, ...body, updatedAt: new Date().toISOString() } : t);
    const updated = trips.find(t => t.id === id);
    return updated ? HttpResponse.json(updated) : new HttpResponse(null, { status: 404 });
  }),

  http.delete('/api/trips/:id', async ({ params }) => {
    await delay();
    trips = trips.filter(t => t.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Outings (Trip Log) ────────────────────────────────────────────────────

  http.get('/api/outings', async () => {
    await delay();
    return HttpResponse.json(outings);
  }),

  http.post('/api/outings', async ({ request }) => {
    await delay();
    const body = await request.json() as Record<string, unknown>;
    const outing = { id: nextOutingId++, createdAt: new Date().toISOString(), photoUrls: [], ...body };
    outings = [...outings, outing as typeof MOCK_OUTINGS[0]];
    return HttpResponse.json(outing, { status: 201 });
  }),

  // ── Photos (no-op in demo mode) ───────────────────────────────────────────

  http.post('/api/photos', async () => {
    await delay(600);
    return HttpResponse.json({ url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800' });
  }),

  // ── Campsite search results ───────────────────────────────────────────────

  http.get('/api/campsites', async ({ request }) => {
    await delay(800);
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') ?? '';
    const sites = provider
      ? MOCK_CAMPSITES.filter(s => s.provider === provider)
      : MOCK_CAMPSITES;
    return HttpResponse.json(sites);
  }),

  // ── Camply job lifecycle (simulated: job starts then immediately completes) ─

  http.post('/api/camply/jobs', async () => {
    await delay(300);
    return HttpResponse.json({ jobId: `mock-job-${Date.now()}`, status: 'running' }, { status: 202 });
  }),

  http.get('/api/camply/status', async () => {
    await delay(200);
    return HttpResponse.json({ status: 'completed' });
  }),

  // ── CamplyPicker search (campground + recreation-area autocomplete) ────────

  http.get('/api/camply/search/:searchType', async ({ request, params }) => {
    await delay(300);
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') ?? '';
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const type = params.searchType as string;

    const seedMap = type === 'recreation-area' ? MOCK_REC_AREA_SEEDS : MOCK_CAMPGROUND_SEEDS;
    const all = (seedMap[provider]?.items ?? []);
    const filtered = q
      ? all.filter(i => i.label.toLowerCase().includes(q) || (i.sublabel ?? '').toLowerCase().includes(q))
      : all;

    return HttpResponse.json({ items: filtered });
  }),
];
