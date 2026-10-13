import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { parasha } = body;
    if (!parasha || typeof parasha !== 'string' || parasha.length > 100) {
      return Response.json({ error: 'Invalid parasha' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `כתוב משפט שבועי אחד בלבד — קצר, מעמיק ויפה — על פרשת ${parasha}.
המשפט צריך להיות:
- משפט אחד בלבד (לא יותר!)
- בעברית תקנית ויפה
- מסר רוחני / מוסרי קצר
- אפשר לכלול ציטוט קצר מהפרשה או מחז"ל
- מתאים לתצוגה בבית הכנסת
אל תפתח עם "פרשת", פשוט תן את המשפט ישירות.`,
      response_json_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', maxLength: 500 },
        },
      },
    });

    if (!result?.text) {
      return Response.json({ error: 'No response from LLM' }, { status: 500 });
    }

    return Response.json({ text: result.text });
  } catch (error) {
    console.error('Torah insight error:', error);
    return Response.json({ error: error.message || 'Failed to generate insight' }, { status: 500 });
  }
});