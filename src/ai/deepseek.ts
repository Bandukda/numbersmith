/*
  The one place this game talks to a network.

  Everything else runs offline with no accounts and no telemetry, and
  that promise is worth keeping literally: the game must stay completely
  playable with no key, no connection and no willingness to use either.
  So this is a single optional call behind one button on the grown-ups'
  screen, and nothing a child does depends on it.

  Two ways in, in this order.

  On a deployed site, the key lives on the server and the browser never
  sees it. The browser sends a password instead, which the server checks
  before spending anyone's credit.

  On a machine you own, there is no server, so a key from .env.local or
  pasted into the app is used directly. That path exists for local
  development and never runs on the deployed site, where the endpoint
  answers first.
*/

const DIRECT_ENDPOINT = 'https://api.deepseek.com/chat/completions'
const SERVER_ENDPOINT = '/api/report'
const MODEL = 'deepseek-chat'
const STORE_KEY = 'numbersmith.deepseek.key'
const PASS_KEY = 'numbersmith.report.pass'

export class ReportError extends Error {}

/* ── the password, for a deployed site ─────────────────────────────── */

export function getPassword(): string {
  try { return (localStorage.getItem(PASS_KEY) ?? '').trim() } catch { return '' }
}

export function setPassword(p: string) {
  try {
    const clean = p.trim()
    if (clean) localStorage.setItem(PASS_KEY, clean)
    else localStorage.removeItem(PASS_KEY)
  } catch { /* private browsing: it just will not be remembered */ }
}

/* ── a key, for a machine you own ──────────────────────────────────── */

export function getKey(): string {
  const fromEnv = (import.meta.env.VITE_DEEPSEEK_API_KEY ?? '').trim()
  if (fromEnv) return fromEnv
  try { return (localStorage.getItem(STORE_KEY) ?? '').trim() } catch { return '' }
}

export function setKey(key: string) {
  try {
    const clean = key.trim()
    if (clean) localStorage.setItem(STORE_KEY, clean)
    else localStorage.removeItem(STORE_KEY)
  } catch { /* as above */ }
}

export function hasKey(): boolean {
  return getKey().length > 0
}

/**
 * Whether this build is served by something that can hold a key.
 *
 * Asked once and remembered. A plain static host answers 404 here, and
 * the direct path takes over.
 */
let serverKnown: boolean | null = null

export async function hasServer(): Promise<boolean> {
  if (serverKnown !== null) return serverKnown
  try {
    /*
      The endpoint has to identify itself, because a status code cannot.
      A dev server answers any unknown path with index.html and a 200, so
      "not a 404" wrongly reads as "something is listening" and the app
      asks for a password nothing can check.

      The real endpoint replies JSON to everything, including the 405 it
      gives a GET. An HTML body is the fallback, and means no server.
    */
    const res = await fetch(SERVER_ENDPOINT, { method: 'GET' })
    const type = res.headers.get('content-type') ?? ''
    serverKnown = type.includes('application/json')
  } catch {
    serverKnown = false
  }
  return serverKnown
}

/**
 * Ask for the written summary.
 *
 * Errors are phrased for a parent or a teacher, because that is who is
 * reading this screen, not a developer.
 */
export async function writeReport(prompt: string, signal?: AbortSignal): Promise<string> {
  if (await hasServer()) return viaServer(prompt, signal)
  return viaKey(prompt, signal)
}

async function viaServer(prompt: string, signal?: AbortSignal): Promise<string> {
  const password = getPassword()
  if (!password) throw new ReportError('Enter the password below to switch this on.')

  let res: Response
  try {
    res = await fetch(SERVER_ENDPOINT, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, password }),
    })
  } catch {
    throw new ReportError('Could not reach the summary service. Check the connection.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401) {
      setPassword('')   // do not keep a password that does not work
      throw new ReportError('That password is not right. Try again.')
    }
    throw new ReportError(data?.error ?? 'Something went wrong. Try again shortly.')
  }
  if (typeof data?.text !== 'string' || !data.text.trim()) {
    throw new ReportError('The summary came back empty. Try again.')
  }
  return data.text.trim()
}

async function viaKey(prompt: string, signal?: AbortSignal): Promise<string> {
  const key = getKey()
  if (!key) throw new ReportError('No API key yet. Add one below to turn this on.')

  let res: Response
  try {
    res = await fetch(DIRECT_ENDPOINT, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch {
    throw new ReportError('Could not reach DeepSeek. Check the connection and try again.')
  }

  if (res.status === 401) throw new ReportError('DeepSeek rejected that key. Check it and try again.')
  if (res.status === 402) throw new ReportError('That DeepSeek account is out of credit.')
  if (res.status === 429) throw new ReportError('Too many requests just now. Wait a moment and try again.')
  if (!res.ok) throw new ReportError(`DeepSeek returned an error (${res.status}). Try again shortly.`)

  const data = await res.json().catch(() => null)
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new ReportError('DeepSeek sent an empty reply. Try again.')
  }
  return text.trim()
}
