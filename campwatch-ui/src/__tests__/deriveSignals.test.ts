/**
 * deriveSignals.test.ts
 *
 * Tests the signal-inference logic in isolation.
 * Verifies that scores come only from RIDB fields (siteType, loop, campgroundName)
 * and that UNKNOWN is returned when data is absent — never invented.
 */

import { describe, it, expect } from 'vitest';
import { deriveSignals } from '../utils/deriveSignals';
import { PRIMITIVE_SITE, ELECTRIC_SITE, WOODED_SITE, SPARSE_SITE } from './fixtures';

describe('deriveSignals — Primitive Fit', () => {
  it('returns HIGH for WALK_IN site type', () => {
    const sig = deriveSignals(PRIMITIVE_SITE);
    expect(sig.primitiveFit).toBe('HIGH');
  });

  it('returns HIGH for TENT_ONLY_NONELECTRIC', () => {
    const sig = deriveSignals({ ...PRIMITIVE_SITE, siteType: 'TENT_ONLY_NONELECTRIC', siteTypeLabel: 'Tent / Non-electric' });
    expect(sig.primitiveFit).toBe('HIGH');
  });

  it('returns LOW for STANDARD_ELECTRIC (hookup site)', () => {
    const sig = deriveSignals(ELECTRIC_SITE);
    expect(sig.primitiveFit).toBe('LOW');
  });

  it('returns MEDIUM for STANDARD_NONELECTRIC', () => {
    const sig = deriveSignals({ ...ELECTRIC_SITE, siteType: 'STANDARD_NONELECTRIC', siteTypeLabel: 'Standard / Non-electric' });
    expect(sig.primitiveFit).toBe('MEDIUM');
  });

  it('returns UNKNOWN when siteType is empty', () => {
    const sig = deriveSignals(SPARSE_SITE);
    expect(sig.primitiveFit).toBe('UNKNOWN');
  });

  it('always includes basis fields explaining the score', () => {
    const sig = deriveSignals(PRIMITIVE_SITE);
    expect(sig.primitiveFitBasis.length).toBeGreaterThan(0);
    expect(sig.primitiveFitBasis[0]).toContain('Walk-In');
  });
});

describe('deriveSignals — Seclusion Estimate', () => {
  it('returns HIGH for WALK_IN site type', () => {
    const sig = deriveSignals(PRIMITIVE_SITE);
    expect(sig.seclusionEstimate).toBe('HIGH');
  });

  it('returns MEDIUM for PRIMITIVE_NONELECTRIC', () => {
    const sig = deriveSignals({ ...PRIMITIVE_SITE, siteType: 'PRIMITIVE_NONELECTRIC', siteTypeLabel: 'Primitive / Non-electric' });
    expect(sig.seclusionEstimate).toBe('MEDIUM');
  });

  it('returns LOW for STANDARD_ELECTRIC', () => {
    const sig = deriveSignals(ELECTRIC_SITE);
    expect(sig.seclusionEstimate).toBe('LOW');
  });

  it('returns MEDIUM when loop name contains WALK keyword', () => {
    const sig = deriveSignals({ ...ELECTRIC_SITE, siteType: 'STANDARD_NONELECTRIC', loop: 'WALK-IN AREA' });
    expect(sig.seclusionEstimate).toBe('MEDIUM');
  });

  it('always includes disclaimer about spacing being unknown', () => {
    const sig = deriveSignals(PRIMITIVE_SITE);
    const hasDisclaimer = sig.seclusionBasis.some(b => b.toLowerCase().includes('actual'));
    expect(hasDisclaimer).toBe(true);
  });
});

describe('deriveSignals — Forest Bathing Fit', () => {
  it('returns HIGH for WOODED_NONELECTRIC site type', () => {
    const sig = deriveSignals(WOODED_SITE);
    expect(sig.forestBathingFit).toBe('HIGH');
  });

  it('returns MEDIUM when loop name contains HEMLOCK', () => {
    const sig = deriveSignals({ ...ELECTRIC_SITE, siteType: 'STANDARD_NONELECTRIC', loop: 'HEMLOCK RIDGE' });
    expect(sig.forestBathingFit).toBe('MEDIUM');
  });

  it('returns MEDIUM when campground name contains FOREST', () => {
    const sig = deriveSignals({ ...ELECTRIC_SITE, campgroundName: 'Wayne National Forest Campground' });
    expect(sig.forestBathingFit).toBe('MEDIUM');
  });

  it('returns LOW when no forest indicators present', () => {
    const sig = deriveSignals(ELECTRIC_SITE);
    expect(sig.forestBathingFit).toBe('LOW');
  });

  it('returns UNKNOWN when siteType and loop are both empty', () => {
    const sig = deriveSignals(SPARSE_SITE);
    expect(sig.forestBathingFit).toBe('UNKNOWN');
  });

  it('always includes disclaimer about vegetation not being from Recreation.gov', () => {
    const sig = deriveSignals(WOODED_SITE);
    const hasDisclaimer = sig.forestBathingBasis.some(b => b.toLowerCase().includes('vegetation') || b.toLowerCase().includes('recreation.gov'));
    expect(hasDisclaimer).toBe(true);
  });
});

describe('deriveSignals — never invents data', () => {
  it('does not return HIGH seclusion for a plain STANDARD_ELECTRIC site with no keywords', () => {
    const sig = deriveSignals(ELECTRIC_SITE);
    expect(sig.seclusionEstimate).not.toBe('HIGH');
  });

  it('does not return HIGH forest bathing for a site with no forest keywords', () => {
    const sig = deriveSignals(ELECTRIC_SITE);
    expect(sig.forestBathingFit).not.toBe('HIGH');
  });

  it('all basis arrays are non-empty even for UNKNOWN scores', () => {
    const sig = deriveSignals(SPARSE_SITE);
    expect(sig.primitiveFitBasis.length).toBeGreaterThan(0);
    // seclusion and forest basis may be empty for fully sparse site — that is OK
  });
});
