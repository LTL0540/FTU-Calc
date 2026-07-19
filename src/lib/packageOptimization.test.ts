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
});
