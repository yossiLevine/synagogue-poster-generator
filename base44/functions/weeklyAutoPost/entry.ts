import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Weekly automation: runs every Friday morning.
 * Fetches Shabbat times from Hebcal and generates WhatsApp links for all subscribers.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Default to Jerusalem coordinates (can be overridden via request body)
    let body = {};
    try {
      if (req.headers.get('content-type')?.includes('json')) {
        body = await req.json();
      }
    } catch (e) {
      console.warn('Failed to parse request body:', e);
    }

    const lat = typeof body.lat === 'number' && body.lat >= -90 && body.lat <= 90 ? body.lat : 31.7683;
    const lng = typeof body.lng === 'number' && body.lng >= -180 && body.lng <= 180 ? body.lng : 35.2137;
    const synagogueName = typeof body.synagogueName === 'string' && body.synagogueName.length <= 100 ? body.synagogueName : 'בית הכנסת';
    const TIMEZONE = 'Asia/Jerusalem';

    function getNextFriday() {
      const d = new Date();
      const day = d.getDay();
      // 5 = Friday in JS (0=Sun)
      const diff = day === 5 ? 0 : (5 - day + 7) % 7;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    }

    const dateA = getNextFriday();
    const d = new Date(dateA);
    const shabbatUrl = `https://www.hebcal.com/shabbat?cfg=json&latitude=${lat}&longitude=${lng}&tzid=${TIMEZONE}&M=on&lg=he&gy=${d.getFullYear()}&gm=${d.getMonth() + 1}&gd=${d.getDate()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    let res;
    try {
      res = await fetch(shabbatUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      return Response.json({ error: `Hebcal API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();

    let parasha = '', candleLighting = '', havdalah = '';
    for (const item of data.items || []) {
      if (item.category === 'parashat') parasha = item.hebrew || item.title || '';
      if (item.category === 'candles' && item.date) {
        candleLighting = new Date(item.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIMEZONE });
      }
      if (item.category === 'havdalah' && item.date) {
        havdalah = new Date(item.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIMEZONE });
      }
    }

    const message = `🕍 *${synagogueName}*\n📖 ${parasha}\n🕯 הדלקת נרות: *${candleLighting}*\n✨ הבדלה: *${havdalah}*\n\nשבת שלום ומבורך! 🌟`;

    // Get active subscribers
    const subscribers = await base44.asServiceRole.entities.SynagogueSubscriber.filter({ active: true });
    
    const results = subscribers
      .filter(s => s.phone && typeof s.phone === 'string')
      .map(s => {
        const cleanPhone = s.phone.replace(/\D/g, '');
        return {
          name: s.name || 'Unknown',
          phone: s.phone,
          whatsappUrl: cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : null,
        };
      })
      .filter(r => r.whatsappUrl);

    return Response.json({ success: true, parasha, candleLighting, havdalah, message, subscriberCount: subscribers.length, validResults: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});