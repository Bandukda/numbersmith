/*
  The one place this game talks to a network.

  Everything else runs offline with no accounts and no telemetry, and that
  is a promise worth keeping literally: the game must stay completely
  playable with no key, no connection and no willingness to use either.
  So this is a single optional call behind one button on the grown-ups'
  screen, and nothing in the child's experience depends on it.

  The key is read from .env.local (gitignored) or from a key the grown-up
  pastes into the app, which is kept in this browser only.
*/

const ENDPOINT = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'
const STORE_KEY = 'numbersmith.deepseek.key'

/** A key from the local env file, or one pasted into the app. */
export function getKey(): string {
  const fromEnv = (import.meta.env.VITE_DEEPSEEK_API_KEY ?? '').trim()
  if (fromEnv) return fromEnv
  try {
    return (localStorage.getItem(STORE_KEY) ?? '').trim()
  } catch {
    return ''
  }
}

export function setKey(key: string) {
  try {
    const clean = key.trim()
    if (clean) localStorage.setItem(STORE_KEY, clean)
    else localStorage.removeItem(STORE_KEY)
  } catch { /* private browsing: the feature just stays unavailable */ }
}

/** True when a summary can be asked for at all. */
export function hasKey(): boolean {
  return getKey().length > 0
}

export class ReportError extends Error {}

/**
 * Ask for the written summary.
 *
 * Errors are surfaced in words a non-engineer can act on, because the
 * person reading this screen is a parent or a teacher, not a developer.
 */
export async function writeReport(prompt: string, signal?: AbortSignal): Promise<string> {
  const key = getKey()
  if (!key) throw new ReportError('No API key yet. Add one below to turn this on.')

  let res: Response
  try {
    res = await fetch(ENDPOINT, {
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
