import { describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('Liturgy & Prayer Rules Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('Should save and load prayer rules from localStorage', () => {
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30, direction: 'after', dayTag: 'A' },
      { label: 'מנחה', baseZman: 'minchaGedola', offsetMinutes: 0, direction: 'after', dayTag: 'A' }
    ];

    // Save
    localStorage.setItem('synagogue_relative_rules', JSON.stringify(rules));

    // Load
    const loaded = JSON.parse(localStorage.getItem('synagogue_relative_rules'));
    
    expect(loaded).toEqual(rules);
    expect(loaded).toHaveLength(2);
  });

  test('Should handle empty rules gracefully', () => {
    localStorage.setItem('synagogue_relative_rules', JSON.stringify([]));
    
    const loaded = JSON.parse(localStorage.getItem('synagogue_relative_rules'));
    expect(loaded).toEqual([]);
    expect(loaded).toHaveLength(0);
  });

  test('Should preserve special Hebrew characters in rules', () => {
    const rules = [
      { label: 'קידוש ודברים ק"ו', baseZman: 'chatzot', offsetMinutes: 0, direction: 'after', dayTag: 'A' }
    ];

    localStorage.setItem('synagogue_relative_rules', JSON.stringify(rules));
    const loaded = JSON.parse(localStorage.getItem('synagogue_relative_rules'));

    expect(loaded[0].label).toContain('ק"ו');
    expect(loaded[0].label).toContain('קידוש');
  });

  test('Should handle large number of rules', () => {
    const rules = Array.from({ length: 50 }, (_, i) => ({
      label: `תפילה ${i + 1}`,
      baseZman: 'sunrise',
      offsetMinutes: i * 5,
      direction: 'after',
      dayTag: i % 2 === 0 ? 'A' : 'B'
    }));

    localStorage.setItem('synagogue_relative_rules', JSON.stringify(rules));
    const loaded = JSON.parse(localStorage.getItem('synagogue_relative_rules'));

    expect(loaded).toHaveLength(50);
    expect(loaded[49].offsetMinutes).toBe(245);
  });

  test('Should handle offset boundary values', () => {
    const rules = [
      { label: 'קדים', baseZman: 'sunrise', offsetMinutes: 0, direction: 'after', dayTag: 'A' },
      { label: 'מאוחר', baseZman: 'sunset', offsetMinutes: 180, direction: 'after', dayTag: 'A' },
      { label: 'לפני', baseZman: 'candleLighting', offsetMinutes: -30, direction: 'before', dayTag: 'A' }
    ];

    localStorage.setItem('synagogue_relative_rules', JSON.stringify(rules));
    const loaded = JSON.parse(localStorage.getItem('synagogue_relative_rules'));

    expect(loaded[0].offsetMinutes).toBe(0);
    expect(loaded[1].offsetMinutes).toBe(180);
    expect(loaded[2].offsetMinutes).toBe(-30);
  });
});