import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dataUrl } = body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return Response.json({ error: 'Invalid or missing dataUrl' }, { status: 400 });
    }

    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) {
      return Response.json({ error: 'Invalid data URL format' }, { status: 400 });
    }

    const base64 = dataUrl.slice(commaIdx + 1);
    const binaryString = atob(base64);
    const len = binaryString.length;

    if (len === 0) {
      return Response.json({ error: 'Empty image data' }, { status: 400 });
    }

    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    if (bytes.length > 20 * 1024 * 1024) {
      return Response.json({ error: 'Image too large (max 20MB)' }, { status: 413 });
    }

    // Use File object (extends Blob) — required by Base44 SDK UploadFile
    const file = new File([bytes], 'poster.png', { type: 'image/png' });

    console.log('Uploading file size:', file.size, 'bytes');

    const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    if (!result?.file_url) {
      throw new Error('Upload returned no file_url');
    }

    return Response.json({ file_url: result.file_url });
  } catch (error) {
    console.error('Upload error:', error.message);
    return Response.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
});