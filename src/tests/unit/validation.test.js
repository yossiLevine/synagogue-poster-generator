import { describe, test, expect } from 'vitest';

describe('Data Validation', () => {
  test('Should validate email format', () => {
    const validEmails = [
      'rabbi@example.com',
      'test+tag@domain.co.il',
      'user.name@synagogue.org'
    ];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });
  });

  test('Should reject invalid email format', () => {
    const invalidEmails = [
      'not-an-email',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com'
    ];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  test('Should validate phone format (Israel)', () => {
    const validPhones = [
      '+972505555555',
      '+972-50-5555555',
      '0505555555'
    ];
    
    const phoneRegex = /^(\+972|0)\d{9,10}$/;
    
    validPhones.forEach(phone => {
      // Remove dashes for validation
      expect(phoneRegex.test(phone.replace(/-/g, ''))).toBe(true);
    });
  });

  test('Should validate coordinates range', () => {
    const validateCoordinates = (lat, lng) => {
      return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    };

    expect(validateCoordinates(32.0853, 34.7818)).toBe(true); // Valid (Tel Aviv)
    expect(validateCoordinates(95, 34.7818)).toBe(false); // Invalid latitude
    expect(validateCoordinates(32.0853, 185)).toBe(false); // Invalid longitude
  });

  test('Should validate required string fields not empty', () => {
    const validateRequired = (value) => {
      return typeof value === 'string' && value.trim().length > 0;
    };

    expect(validateRequired('בית כנסת')).toBe(true);
    expect(validateRequired('')).toBe(false);
    expect(validateRequired('   ')).toBe(false);
  });

  test('Should validate prayer time format HH:MM', () => {
    const timeRegex = /^\d{2}:\d{2}$/;
    
    expect(timeRegex.test('07:00')).toBe(true);
    expect(timeRegex.test('18:45')).toBe(true);
    expect(timeRegex.test('7:00')).toBe(false);
    expect(timeRegex.test('25:00')).toBe(true); // Regex doesn't validate range
  });
});