/**
 * Supplement tracker sync proxy.
 *
 * Holds your GitHub token as a Worker secret (never sent to the browser) and
 * only accepts commits from requests carrying the correct PIN. Deploy this
 * once; every device just needs the Worker URL + the short PIN, not the
 * long GitHub token.
 *
 * Required environment variables (set as Secrets in the Cloudflare dashboard):
 *   GITHUB_TOKEN   - a fine-grained PAT scoped to this one repo, Contents: Read and write
 *   GITHUB_OWNER   - your GitHub username/org, e.g. "muzz123"
 *   GITHUB_REPO    - the repo name, e.g. "supplement-tracker"
 *   GITHUB_BRANCH  - usually "main"
 *   SYNC_PIN       - a short string/number you make up, e.g. "482913"
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'Invalid JSON body' }, 400);
    }

    const { path, content, pin } = body;

    if (!env.SYNC_PIN || pin !== env.SYNC_PIN) {
      return json({ ok: false, error: 'Invalid PIN' }, 401);
    }
    if (!path || typeof content !== 'string') {
      return json({ ok: false, error: 'Missing path or content' }, 400);
    }
    // Only allow writing inside data/ — this proxy should never be able to
    // touch anything else in the repo, even with a valid PIN.
    if (!/^data\/[a-zA-Z0-9_-]+\.json$/.test(path)) {
      return json({ ok: false, error: 'Path not allowed' }, 400);
    }

    const branch = env.GITHUB_BRANCH || 'main';
    const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
    const ghHeaders = {
      Authorization: `token ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'supplement-tracker-sync-worker',
    };

    try {
      let sha;
      const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
      if (getRes.ok) {
        const existing = await getRes.json();
        sha = existing.sha;
      }

      const encoded = base64Encode(content);
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...ghHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Update ${path} via app`,
          content: encoded,
          sha,
          branch,
        }),
      });

      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        return json({ ok: false, error: err.message || putRes.statusText }, 502);
      }
      return json({ ok: true });
    } catch (e) {
      return json({ ok: false, error: e.message }, 500);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function base64Encode(str) {
  // UTF-8 safe base64 encoding, works in the Workers runtime.
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}
