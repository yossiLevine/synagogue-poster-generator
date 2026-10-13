import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can create accounts
    if (!user || user.role !== 'admin') {
      return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { synagogue_id, username, password, email, phone, subscribed_to_reminders } = await req.json();

    if (!synagogue_id || !username || !password) {
      return Response.json({ success: false, message: 'חסרים פרטים' }, { status: 400 });
    }

    // Validate phone format
    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      return Response.json({ success: false, message: 'טלפון לא תקין' }, { status: 400 });
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, message: 'אימייל לא תקין' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return Response.json({ success: false, message: 'סיסמה חייבת להיות 6 תווים לפחות' }, { status: 400 });
    }

    // Check if username already exists
    const existing = await base44.asServiceRole.entities.SynagogueAccount.filter({ username });
    if (existing.length > 0) {
      return Response.json({ success: false, message: 'שם משתמש כבר קיים' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await base44.asServiceRole.entities.SynagogueAccount.create({
      synagogue_id,
      username,
      password_hash: passwordHash,
      email: email || '',
      phone: phone || '',
      role: 'gabaai',
      subscribed_to_reminders: subscribed_to_reminders !== false,
      is_active: true,
    });

    return Response.json({
      success: true,
      username,
      password,
      message: 'חשבון נוצר בהצלחה',
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
});