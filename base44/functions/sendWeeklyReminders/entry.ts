import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active gabais subscribed to reminders
    const accounts = await base44.asServiceRole.entities.SynagogueAccount.filter({
      role: 'gabaai',
      subscribed_to_reminders: true,
      is_active: true,
    });

    // Get synagogue data for context
    const synagogues = await base44.asServiceRole.entities.Synagogue.list();
    const synagogueMap = {};
    synagogues.forEach(s => synagogueMap[s.id] = s);

    let successCount = 0;
    const errors = [];
    const failedAccounts = [];

    // Send messages to each gabai
    for (const account of accounts) {
      if (!account.id || !account.synagogue_id || !account.username) {
        errors.push('Invalid account data');
        continue;
      }

      try {
        const synagogue = synagogueMap[account.synagogue_id];
        const synagogueName = synagogue?.name || 'בית הכנסת';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.example.com';
        const editorUrl = `${appUrl}/editor`;

        const message = `
🕍 *תזכורת שבועית - ${synagogueName}*

שלום ${account.username}! 👋

זה זמן להכין את מודעת התפילה לשבת הקרובה 📋

לחץ כאן כדי ליצור מודעה:
${editorUrl}

בואנו נזכור להוסיף:
✓ זמני התפילה
✓ פרשת השבוע
✓ הודעות חשובות

בהצלחה! 🙏
        `.trim();

        // Send email (primary method)
        if (account.email && account.email.includes('@')) {
          try {
            await base44.integrations.Core.SendEmail({
              to: account.email,
              subject: `תזכורת מודעה - ${synagogueName}`,
              body: message.replace(/\n/g, '<br>'),
              from_name: 'מחולל מודעות',
            });
            successCount++;
          } catch (e) {
            errors.push(`${account.username}: Email failed - ${e.message}`);
            failedAccounts.push(account.id);
          }
        } else {
          errors.push(`${account.username}: Invalid or missing email`);
          failedAccounts.push(account.id);
        }
      } catch (e) {
        errors.push(`${account.username}: ${e.message}`);
        failedAccounts.push(account.id);
      }
    }

    return Response.json({
      success: true,
      successCount,
      totalAccounts: accounts.length,
      failedCount: failedAccounts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});