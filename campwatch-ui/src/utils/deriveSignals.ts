/**
 * deriveSignals.ts — infer fit scores from RIDB/Camply facts ONLY.
 * These are ESTIMATES. Never present them as official source data.
 * Scored from: siteType, loop name, campgroundName text.
 * NOT scored: cell signal, road quality, privacy, fire restrictions (not in data model).
 */

import type { CampsiteFacts, DerivedSignals, FitScore, SiteStatus } from '../types/camping';

export const SITE_TYPE_LABELS: Record<string, string> = {
  TENT_ONLY_NONELECTRIC: 'Tent / Non-electric',
  TENT_ONLY:             'Tent Only',
  STANDARD_NONELECTRIC:  'Standard / Non-electric',
  STANDARD_ELECTRIC:     'Standard / Electric',
  PRIMITIVE_NONELECTRIC: 'Primitive / Non-electric',
  PRIMITIVE:             'Primitive',
  WALK_IN:               'Walk-In',
  WOODED_NONELECTRIC:    'Wooded / Non-electric',
  FULL_HOOKUP:           'Full Hookup (RV)',
  RV_LOOP:               'RV Loop',
};

const PRIMITIVE_TYPES = new Set(['PRIMITIVE_NONELECTRIC','PRIMITIVE','WALK_IN','TENT_ONLY_NONELECTRIC','TENT_ONLY','WOODED_NONELECTRIC']);
const HOOKUP_TYPES    = new Set(['FULL_HOOKUP','RV_LOOP','STANDARD_ELECTRIC']);
const FOREST_WORDS    = ['WOOD','FOREST','TIMBER','PINE','OAK','RIDGE','HOLLOW','HEMLOCK','CEDAR','BIRCH','MAPLE','GROVE'];

export function deriveSignals(facts: CampsiteFacts): DerivedSignals {
  const type     = (facts.siteType ?? '').toUpperCase();
  const loop     = (facts.loop ?? '').toUpperCase();
  const campName = (facts.campgroundName ?? '').toUpperCase();

  // ── Primitive Fit ──────────────────────────────────────────────────────────
  let primitiveFit: FitScore;
  const primitiveBasis: string[] = [];
  if (!type)                    { primitiveFit = 'UNKNOWN'; primitiveBasis.push('Site type not available from provider'); }
  else if (PRIMITIVE_TYPES.has(type)) { primitiveFit = 'HIGH';  primitiveBasis.push(`Site type: ${facts.siteTypeLabel}`); }
  else if (HOOKUP_TYPES.has(type))    { primitiveFit = 'LOW';   primitiveBasis.push(`Site type: ${facts.siteTypeLabel} — hookup/RV site`); }
  else                                { primitiveFit = 'MEDIUM'; primitiveBasis.push(`Site type: ${facts.siteTypeLabel}`); }

  // ── Seclusion Estimate ────────────────────────────────────────────────────
  // IMPORTANT: actual site spacing unknown — flagged in basis
  let seclusionEstimate: FitScore;
  const seclusionBasis: string[] = [
    'Estimated from site type and loop name only',
    'Actual site spacing unknown — verify with park',
  ];
  if (type === 'WALK_IN')                          { seclusionEstimate = 'HIGH';    seclusionBasis.unshift('Site type: Walk-In'); }
  else if (type === 'PRIMITIVE_NONELECTRIC' || type === 'PRIMITIVE') { seclusionEstimate = 'MEDIUM'; seclusionBasis.unshift('Site type: Primitive'); }
  else if (['WALK','BACKCOUNTR','PRIMITIVE','REMOTE'].some(k => loop.includes(k))) { seclusionEstimate = 'MEDIUM'; seclusionBasis.unshift(`Loop name: "${facts.loop}"`); }
  else if (!type)                                  { seclusionEstimate = 'UNKNOWN'; }
  else                                             { seclusionEstimate = 'LOW';     seclusionBasis.unshift('Standard / drive-up site type'); }

  // ── Forest Bathing Fit ────────────────────────────────────────────────────
  // IMPORTANT: actual vegetation not available from Recreation.gov
  let forestBathingFit: FitScore;
  const forestBasis: string[] = [
    'Estimated from site type and name keywords only',
    'Actual vegetation not available from Recreation.gov — verify with park',
  ];
  const matched = FOREST_WORDS.find(k => loop.includes(k) || campName.includes(k));
  if (type === 'WOODED_NONELECTRIC')  { forestBathingFit = 'HIGH';    forestBasis.unshift(`Site type: ${facts.siteTypeLabel}`); }
  else if (matched)                   { forestBathingFit = 'MEDIUM';  forestBasis.unshift(`Name keyword: "${matched}" found in loop/campground`); }
  else if (!type && !loop)            { forestBathingFit = 'UNKNOWN'; }
  else                                { forestBathingFit = 'LOW';     forestBasis.unshift('No forest indicators in available name fields'); }

  return { primitiveFit, primitiveFitBasis: primitiveBasis, seclusionEstimate, seclusionBasis, forestBathingFit, forestBathingBasis: forestBasis };
}

export function alertToFacts(alert: {
  id: number; campgroundName: string; provider: string; siteId: string; siteType: string;
  isReservable: boolean; checkIn: string; checkOut: string; bookingUrl: string;
  matchScore: number; status: string; receivedAt: string; loop?: string;
}): CampsiteFacts {
  const nights = Math.round((new Date(alert.checkOut).getTime() - new Date(alert.checkIn).getTime()) / 86400000);
  return {
    id: alert.id, campgroundName: alert.campgroundName, campgroundId: '', provider: alert.provider,
    siteId: alert.siteId, siteType: alert.siteType,
    siteTypeLabel: SITE_TYPE_LABELS[alert.siteType] ?? alert.siteType ?? 'Unknown type',
    isReservable: alert.isReservable, loop: alert.loop, checkIn: alert.checkIn,
    checkOut: alert.checkOut, nights, bookingUrl: alert.bookingUrl,
    receivedAt: alert.receivedAt, status: alert.status as SiteStatus, matchScore: alert.matchScore,
  };
}
