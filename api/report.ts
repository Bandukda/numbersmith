/*
  The written summary, generated on the server.

  This exists because of one hard fact: Vite inlines any VITE_* variable
  into the JavaScript it ships, so a key held that way is readable by
  anyone who opens the browser's dev tools. On a machine you own that is
  merely untidy. On a public deployment it is the key given away.

  It also makes the password mean something. A password checked in the
  browser would be theatre: whoever wanted past it could read the key out
  of the bundle and call the model directly. Checked here, with the key
  never leaving the server, the gate is real.
*/

export const config = { runtime: 'edge' }

const ENDPOINT = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'
/** A generous ceiling. The real snapshot is a few hundred characters. */
const MAX_PROMPT = 8000

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/** Compare without leaking which character differed through timing. */
function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function handler(req: Request): Promise<Response> {
  /*
    The client sends a GET here on the grown-ups' page purely to find out
    whether it is running on a deployment with a server behind it or on
    somebody's laptop. It answers 200, not 405: the check is a normal
    part of the page loading, and a red line in the console makes a
    working site look broken to anyone who opens dev tools.

    It says nothing about whether the key or the password are set. The
    POST already answers that, to whoever has the password.
  */
  if (req.method === 'GET') return json({ ok: true })
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  const key = process.env.DEEPSEEK_API_KEY
  const password = process.env.REPORT_PASSWORD

  /*
    No password configured means the gate is missing, not open. Failing
    closed is the only safe reading: the alternative is a deployment that
    silently serves someone else's model credit to the whole internet.
  */
  if (!key || !password) {
    return json({ error: 'The written summary is not switched on for this site.' }, 503)
  }

  let body: { prompt?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Could not read that request.' }, 400)
  }

  const given = typeof body.password === 'string' ? body.password : ''
  if (!sameSecret(given, password)) {
    return json({ error: 'That password is not right.' }, 401)
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  if (!prompt.trim()) return json({ error: 'Nothing to summarise.' }, 400)
  if (prompt.length > MAX_PROMPT) return json({ error: 'That is too much to summarise.' }, 413)

  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch {
    return json({ error: 'Could not reach the summary service. Try again shortly.' }, 502)
  }

  if (!res.ok) {
    // The upstream reason stays here: a caller does not need to know
    // whose account is out of credit.
    const reason = res.status === 401 || res.status === 402
      ? 'The summary service is not available right now.'
      : 'The summary service returned an error. Try again shortly.'
    return json({ error: reason }, 502)
  }

  const data = await res.json().catch(() => null)
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    return json({ error: 'The summary came back empty. Try again.' }, 502)
  }
  return json({ text: text.trim() })
}
