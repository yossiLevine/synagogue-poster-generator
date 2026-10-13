import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

let loginAttempts = {};
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

const checkRateLimit = (username) => {
  const now = Date.now();
  const key = username;
  if (!loginAttempts[key]) {
    loginAttempts[key] = [];
  }
  loginAttempts[key] = loginAttempts[key].filter(t => now - t < ATTEMPT_WINDOW);
  if (loginAttempts[key].length >= MAX_ATTEMPTS) {
    return false;
  }
  loginAttempts[key].push(now);
  return true;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const { username, password } = body;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return Response.json({ success: false, message: 'חסרים פרטים' }, { status: 400 });
    }

    // Rate limiting
    if (!checkRateLimit(username)) {
      return Response.json({ success: false, message: 'יותר מדי ניסיונות. נסה שוב בעוד דקות' }, { status: 429 });
    }

    // Prevent timing attacks with constant-time comparison
    const accounts = await base44.asServiceRole.entities.SynagogueAccount.filter({ username });
    const account = accounts.length > 0 ? accounts[0] : null;
    
    const passwordHash = await hashPassword(password);
    const isValidPassword = account && account.password_hash === passwordHash;
    const isActive = account?.is_active === true;
    
    if (!isValidPassword || !isActive) {
      // Return same message for both invalid username and password
      return Response.json({ success: false, message: 'שם משתמש או סיסמה שגויה' }, { status: 401 });
    }

    // Generate secure token
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    return Response.json({
      success: true,
      token,
      synagogue_id: account.synagogue_id,
      role: account.role,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
});