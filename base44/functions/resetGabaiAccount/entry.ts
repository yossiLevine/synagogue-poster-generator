import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { accountId } = body;
    if (!accountId || typeof accountId !== 'string') {
      return Response.json({ error: 'Invalid accountId' }, { status: 400 });
    }

    // Fetch account
    const account = await base44.asServiceRole.entities.SynagogueAccount.get(accountId);
    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    // Generate new password using Web Crypto API
    const newPasswordBytes = crypto.getRandomValues(new Uint8Array(8));
    const newPassword = Array.from(newPasswordBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(newPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update account
    await base44.asServiceRole.entities.SynagogueAccount.update(accountId, {
      password_hash: passwordHash,
    });

    // Send email
    if (account.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: account.email,
          subject: `איפוס סיסמה - ${account.username}`,
          body: `שלום ${account.username},\n\nסיסמתך אופסה.\n\nשם משתמש: ${account.username}\nסיסמה חדשה: ${newPassword}\n\nהכנס לאתר והחליף סיסמה בהקדם.\n\nYL AI`,
          from_name: 'מחולל מודעות',
        });
      } catch (emailError) {
        console.warn('Failed to send email:', emailError);
        // Continue anyway - password was reset
      }
    }

    return Response.json({
      success: true,
      message: 'חשבון אופס בהצלחה',
      newPassword: newPassword,
      email: account.email,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});