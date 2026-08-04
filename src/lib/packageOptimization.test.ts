import { describe, expect, it } from 'vitest';
import { optimizePackages } from './packageOptimization';

describe('package optimization', () => {
  it('uses the smallest adequate single package for 35 g', () => {
    expect(optimizePackages(35, [7.5, 15, 30, 45, 60, 90]).packages).toEqual([45]);
  });

  it('uses the smallest adequate single package for 49 g', () => {
    expect(optimizePackages(49, [7.5, 15, 30, 45, 60, 90]).packages).toEqual([60]);
  });

  it('uses 90 g when combinations are not allowed by the configured sizes', () => {
    expect(optimizePackages(66, [90]).packages).toEqual([90]);
  });

  it('prefers 45 g + 30 g over 90 g when the combination materially reduces waste', () => {
    const result = optimizePackages(66, [15, 30, 45, 60, 90]);
    expect(result.totalGrams).toBe(75);
    expect(result.packages).toEqual([60, 15]);
    expect(result.excessGrams).toBe(9);
  });

  it('uses 120 g + 15 g for a 130 g requirement', () => {
    const result = optimizePackages(130, [15, 30, 45, 60, 90, 120, 225]);
    expect(result.totalGrams).toBe(135);
    expect(result.packages).toEqual([120, 15]);
  });

  it('prefers two matching 100 g packages for a 196 g requirement', () => {
    const result = optimizePackages(196, [15, 30, 45, 60, 90, 100, 120, 240]);
    expect(result.totalGrams).toBe(200);
    expect(result.packages).toEqual([100, 100]);
  });

  it('keeps a lower-waste mixed pair when the same-size option exceeds the practical allowance', () => {
    const result = optimizePackages(196, [15, 30, 45, 60, 90, 120, 240]);
    expect(result.totalGrams).toBe(210);
    expect(result.packages).toEqual([120, 90]);
  });

  it('accepts one 225 g package for 196 g when its 29 g excess is within the capped allowance', () => {
    const result = optimizePackages(196, [90, 120, 225]);
    expect(result.totalGrams).toBe(225);
    expect(result.packages).toEqual([225]);
  });

  it('prefers matching multi-pack sizes when excess is within 20% and package count is unchanged', () => {
    const result = optimizePackages(100, [45, 60]);
    expect(result.totalGrams).toBe(120);
    expect(result.packages).toEqual([60, 60]);
  });

  it('never recommends less than the requirement', () => {
    const result = optimizePackages(98.01, [15, 30, 45, 60, 90, 100]);
    expect(result.totalGrams).toBeGreaterThanOrEqual(98.01);
  });

  it('honours the 30 g practical-excess cap for a large course', () => {
    const result = optimizePackages(2184.36, [15, 30, 45, 60, 90, 100, 120, 240, 454]);
    expect(result.totalGrams).toBe(2185);
    expect(result.excessGrams).toBeCloseTo(0.64, 8);
    expect(result.packages).not.toEqual([454, 454, 454, 454, 454]);
  });

  it('applies the disclosed 20 g floor for small requirements', () => {
    const result = optimizePackages(16, [7.5, 15, 30]);
    expect(result.packages).toEqual([30]);
    expect(result.excessGrams).toBe(14);
  });

  it.each([
    [Number.NaN, [15, 30]],
    [Number.POSITIVE_INFINITY, [15, 30]],
    [10_001, [15, 30]],
    [30, [15, Number.POSITIVE_INFINITY]],
    [30, [0.01, 15]],
  ])('rejects unsafe requirement %s or package inputs', (requirement, sizes) => {
    const result = optimizePackages(requirement, sizes);
    expect(result.valid).toBe(false);
    expect(result.packages).toEqual([]);
  });

  it('never under-supplies across a representative property sweep', () => {
    const sizes = [7.5, 15, 30, 45, 60, 90, 100, 120, 240, 454];
    for (let requirement = 0.1; requirement <= 500; requirement += 1.7) {
      const result = optimizePackages(requirement, sizes);
      expect(result.valid).toBe(true);
      expect(result.totalGrams).toBeGreaterThanOrEqual(requirement);
      expect(result.excessGrams).toBeGreaterThanOrEqual(0);
    }
  });
});
