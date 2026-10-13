import { describe, test, expect, beforeEach } from 'vitest';

describe('Synagogue Data Integrity', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('Should preserve synagogue metadata on update', () => {
    const synagogueData = {
      id: 'syn-test-001',
      name: 'בית כנסת תוברי קדיש',
      city: 'תל אביב',
      latitude: 32.0853,
      longitude: 34.7818,
      logo_url: 'https://example.com/logo.png',
      default_theme: 'classic',
      default_frame: 'classic',
      is_active: true,
      created_date: '2026-01-01T00:00:00Z',
      updated_date: '2026-04-17T00:00:00Z'
    };

    // Simulate saving
    localStorage.setItem('synagogue_metadata', JSON.stringify(synagogueData));

    // Update only city
    const updated = JSON.parse(localStorage.getItem('synagogue_metadata'));
    updated.city = 'ירושלים';
    localStorage.setItem('synagogue_metadata', JSON.stringify(updated));

    // Load and verify other fields preserved
    const loaded = JSON.parse(localStorage.getItem('synagogue_metadata'));
    
    expect(loaded.name).toBe('בית כנסת תוברי קדיש');
    expect(loaded.city).toBe('ירושלים');
    expect(loaded.logo_url).toBe('https://example.com/logo.png');
    expect(loaded.latitude).toBe(32.0853);
  });

  test('Should store and retrieve prayer rules without corruption', () => {
    const prayerRules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30 },
      { label: 'מנחה', baseZman: 'minchaGedola', offsetMinutes: 0 }
    ];

    const synagogueData = {
      id: 'syn-001',
      name: 'בית כנסת',
      prayer_rules: JSON.stringify(prayerRules)
    };

    localStorage.setItem('synagogue_001', JSON.stringify(synagogueData));
    const loaded = JSON.parse(localStorage.getItem('synagogue_001'));
    const parsedRules = JSON.parse(loaded.prayer_rules);

    expect(parsedRules).toEqual(prayerRules);
  });

  test('Should handle null/undefined logo gracefully', () => {
    const synagogueData = {
      id: 'syn-002',
      name: 'בית כנסת ללא לוגו',
      city: 'תל אביב',
      logo_url: null
    };

    localStorage.setItem('synagogue_002', JSON.stringify(synagogueData));
    const loaded = JSON.parse(localStorage.getItem('synagogue_002'));

    expect(loaded.logo_url).toBeNull();
    expect(loaded.name).toBe('בית כנסת ללא לוגו');
  });

  test('Should maintain data integrity with special characters', () => {
    const specialData = {
      id: 'syn-003',
      name: 'בית כנסת "ש"ס" בתל אביב',
      announcements: 'שיעור בנושא "קידוש ו\'קידוש ודברים\'"'
    };

    localStorage.setItem('synagogue_003', JSON.stringify(specialData));
    const loaded = JSON.parse(localStorage.getItem('synagogue_003'));

    expect(loaded.name).toContain('ש"ס');
    expect(loaded.announcements).toContain('ודברים');
  });

  test('Should validate that required fields exist after load', () => {
    const synagogueData = {
      id: 'syn-004',
      name: 'בית כנסת שלם',
      city: 'ירושלים'
    };

    localStorage.setItem('synagogue_004', JSON.stringify(synagogueData));
    const loaded = JSON.parse(localStorage.getItem('synagogue_004'));

    const requiredFields = ['id', 'name', 'city'];
    requiredFields.forEach(field => {
      expect(loaded).toHaveProperty(field);
      expect(loaded[field]).toBeDefined();
    });
  });
});