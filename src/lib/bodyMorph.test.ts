import { describe, expect, it } from 'vitest';
import { calculateBodyMorph } from './bodyMorph';

describe('body model visual morphing', () => {
  it('renders a tall proportionate adult as longer rather than substantially wider', () => {
    const morph = calculateBodyMorph({ patientMode: 'adult', pediatricStage: 'older', heightCm: 195, weightKg: 86 });
    expect(morph.statureLabel).toBe('Tall');
    expect(morph.legLength).toBeGreaterThan(1.07);
    expect(morph.torsoWidth).toBeLessThan(1.04);
  });

  it('adds width and a stronger posterior profile for a higher-BMI adult', () => {
    const morph = calculateBodyMorph({ patientMode: 'adult', pediatricStage: 'older', heightCm: 160, weightKg: 95 });
    expect(morph.buildLabel).toBe('Broad');
    expect(morph.torsoWidth).toBeGreaterThan(1.2);
    expect(morph.torsoWidth).toBeGreaterThan(morph.shoulderWidth);
    expect(morph.torsoWidth).toBeGreaterThan(morph.armWidth);
    expect(morph.buttockWidth).toBeGreaterThan(morph.torsoWidth);
    expect(morph.buttockRoundness).toBeGreaterThan(1.1);
  });

  it('keeps infant visual scaling deliberately restrained', () => {
    const morph = calculateBodyMorph({ patientMode: 'child', pediatricStage: 'infant', heightCm: 85, weightKg: 18 });
    expect(morph.torsoWidth).toBeLessThanOrEqual(1.065);
    expect(morph.legLength).toBeLessThanOrEqual(1.02);
  });

  it('keeps a small posterior contour on the reference adult model', () => {
    const morph = calculateBodyMorph({ patientMode: 'adult', pediatricStage: 'older', heightCm: 170, weightKg: 63.6 });
    expect(morph.buttockWidth).toBeGreaterThan(1);
    expect(morph.buttockRoundness).toBeGreaterThan(1);
  });

  it('concentrates high-weight scaling through the abdomen rather than the shoulders', () => {
    const morph = calculateBodyMorph({ patientMode: 'adult', pediatricStage: 'older', heightCm: 150, weightKg: 226.8 });
    expect(morph.torsoWidth - morph.shoulderWidth).toBeGreaterThan(0.35);
    expect(morph.pelvisWidth).toBeGreaterThan(morph.shoulderWidth);
  });
});
