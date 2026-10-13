import { calcPrayerRowsFromRules } from '@/components/RelativeZmanimConfig';
import { describe, test, expect } from 'vitest';

describe('Prayer Rules Calculation', () => {
  test('Should calculate prayer time 30 minutes after sunrise', () => {
    const mockZmanim = {
      sunrise: '2026-04-18T05:30:00Z',
      sunset: '2026-04-18T18:45:00Z',
    };
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30, direction: 'after', dayTag: 'A' }
    ];
    
    const result = calcPrayerRowsFromRules(rules, mockZmanim, null, null);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('שחרית');
    expect(result[0].time).toBeDefined();
  });

  test('Should handle negative offset (before)', () => {
    const mockZmanim = {
      sunset: '2026-04-18T18:45:00Z',
    };
    const rules = [
      { label: 'מעריב', baseZman: 'sunset', offsetMinutes: -5, direction: 'before', dayTag: 'A' }
    ];
    
    const result = calcPrayerRowsFromRules(rules, mockZmanim, null, null);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('מעריב');
  });

  test('Should use day B zmanim when dayTag is B', () => {
    const zmanimA = { sunrise: '2026-04-18T05:30:00Z' };
    const zmanimB = { sunrise: '2026-04-19T05:28:00Z' };
    const rules = [
      { label: 'שחרית שבת', baseZman: 'sunrise', offsetMinutes: 30, direction: 'after', dayTag: 'B' }
    ];
    
    const result = calcPrayerRowsFromRules(rules, zmanimA, null, zmanimB);
    expect(result).toHaveLength(1);
    expect(result[0].dayTag).toBe('B');
  });

  test('Should filter out rules with missing zmanim', () => {
    const mockZmanim = {
      sunrise: '2026-04-18T05:30:00Z',
    };
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 0, direction: 'after', dayTag: 'A' },
      { label: 'מעריב', baseZman: 'nonexistent', offsetMinutes: 0, direction: 'after', dayTag: 'A' }
    ];
    
    const result = calcPrayerRowsFromRules(rules, mockZmanim, null, null);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('שחרית');
  });

  test('Should return empty array for empty rules', () => {
    const mockZmanim = { sunrise: '2026-04-18T05:30:00Z' };
    const result = calcPrayerRowsFromRules([], mockZmanim, null, null);
    expect(result).toHaveLength(0);
  });
});