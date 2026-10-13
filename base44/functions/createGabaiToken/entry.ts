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

    const { synagogueId } = body;
    if (!synagogueId || typeof synagogueId !== 'string') {
      return Response.json({ error: 'Invalid synagogueId' }, { status: 400 });
    }

    // Verify synagogue exists
    try {
      await base44.entities.Synagogue.get(synagogueId);
    } catch (e) {
      return Response.json({ error: 'Synagogue not found' }, { status: 404 });
    }

    // Generate secure token for admin to impersonate as gabai
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const randomSuffix = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const token = `admin_${randomSuffix}`;

    return Response.json({
      success: true,
      token,
      synagogue_id: synagogueId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});