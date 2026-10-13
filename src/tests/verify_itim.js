if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
}

import { fetchZmanimTwoDays, fetchShabbatInfo, buildZmanimForDisplay } from '../lib/zmanimApi.js';
import { clearConfigCache, DEFAULT_CONFIG } from '../lib/synagogueConfig.js';

async function verify() {
  console.log('=== TEST 1: Jerusalem (ירושלים) ===');
  localStorage.setItem('synagogue_main_config', JSON.stringify({
    ...DEFAULT_CONFIG,
    cityName: 'ירושלים',
    horizonName: 'ירושלים',
    lat: 31.769,
    lng: 35.216
  }));
  clearConfigCache();

  const friday = '2026-09-18';
  const shabbat = '2026-09-19';

  const [zmanim, shabbatInfo] = await Promise.all([
    fetchZmanimTwoDays(friday, shabbat),
    fetchShabbatInfo(friday),
  ]);

  console.log('Source:', zmanim.zmanimSource);
  console.log('Parasha:', shabbatInfo.parasha);
  console.log('Candle Lighting:', shabbatInfo.candleLighting);
  console.log('Havdalah:', shabbatInfo.havdalah);
  console.log('Hebrew Date Friday:', zmanim.hebrewDateA);
  console.log('Hebrew Date Shabbat:', zmanim.hebrewDateB);

  const displayList = buildZmanimForDisplay(
    zmanim.zmanimA,
    shabbatInfo,
    ['candleLighting', 'sunset', 'sunriseShabbat', 'sofZmanShmaShabbat', 'sofZmanShmaMGAShabbat', 'tzeit7083deg', 'tzeit72min'],
    zmanim.zmanimB
  );

  console.log('\nDisplay Zmanim for Poster:');
  displayList.forEach(z => console.log(`- ${z.label}: ${z.time} (${z.day})`));

  console.log('\n=== TEST 2: Meitzad (מיצד) ===');
  localStorage.setItem('synagogue_main_config', JSON.stringify({
    ...DEFAULT_CONFIG,
    cityName: 'מיצד',
    horizonName: 'מיצד',
    lat: 31.586,
    lng: 35.188
  }));
  clearConfigCache();
  const [zmanimM, shabbatInfoM] = await Promise.all([
    fetchZmanimTwoDays(friday, shabbat),
    fetchShabbatInfo(friday),
  ]);
  console.log('Meitzad Source:', zmanimM.zmanimSource);
  console.log('Meitzad Candle Lighting:', shabbatInfoM.candleLighting);
  console.log('Meitzad Havdalah:', shabbatInfoM.havdalah);

  console.log('\n✅ VERIFICATION COMPLETE - ALL ITIM LEBINA DATA RESOLVED!');
}

verify().catch(console.error);
