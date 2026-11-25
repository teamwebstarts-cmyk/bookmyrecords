/**
 * BookMyRecords — provider-agnostic OpenAI-compatible AI client.
 * Reads everything from environment so the provider can be swapped with env vars only.
 */

'use strict';

let lastError = null;

function clean(value) {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!v || /^(replace|your-|optional|none)$/i.test(v)) return '';
  return v;
}

function getKeys() {
  return [process.env.AI_API_KEY, process.env.AI_API_KEY_ALT]
    .map(clean)
    .filter((v, i, arr) => v && arr.indexOf(v) === i);
}

function getAiConfig() {
  const groqKey = clean(process.env.GROQ_API_KEY);
  const groqBase = clean(process.env.GROQ_BASE_URL).replace(/\/+$/, '');
  const useGroq = !!(groqKey && groqBase);
  const baseUrl = useGroq ? groqBase : clean(process.env.AI_BASE_URL).replace(/\/+$/, '');
  const model = useGroq
    ? (clean(process.env.GROQ_MODEL) || 'openai/gpt-oss-120b')
    : (clean(process.env.AI_MODEL) || 'deepseek-v4.1-flash-free');
  const keys = useGroq ? [groqKey] : getKeys();
  const mock = process.env.AI_MOCK_MODE === 'true';
  return { baseUrl, model, keys, mock, enabled: !mock && !!baseUrl && keys.length > 0, provider: useGroq ? 'groq' : 'configured' };
}

function isAiEnabled() {
  return getAiConfig().enabled;
}

function getEngineLabel() {
  const cfg = getAiConfig();
  return cfg.model || 'ai-provider';
}

function getLastError() {
  return lastError;
}

function extractJson(text) {
  if (typeof text !== 'string') throw new Error('AI returned no text content');
  let cleanText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/g, '').trim();
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    const start = cleanText.indexOf('{');
    const end = cleanText.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleanText.slice(start, end + 1));
      } catch (_) { /* fall through */ }
    }
    throw new Error('AI response was not valid JSON: ' + err.message);
  }
}

/**
 * Call the configured chat-completions endpoint and return a parsed JSON object.
 * Tries each configured key; a 401/403 moves to the next key, other errors abort.
 */
async function callAiJson({ system = '', user = '',     timeoutMs = 120000, maxTokens = 8192 } = {}) {
  const cfg = getAiConfig();
  if (!cfg.enabled) throw new Error('AI is disabled (AI_MOCK_MODE or missing base URL/key)');

  lastError = null;
  let authError = null;

  for (const key of cfg.keys) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: user }
          ],
          temperature: 0.1,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      if ((response.status === 401 || response.status === 403)) {
        authError = new Error(`AI authentication failed (HTTP ${response.status})`);
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`AI provider returned HTTP ${response.status}: ${body.slice(0, 300)}`);
      }

      const data = await response.json();
      const content = data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;
      const parsed = extractJson(content);
      lastError = null;
      return parsed;
    } catch (err) {
      lastError = err;
      if (authError && err === authError) continue;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw authError || lastError || new Error('No AI provider key available');
}

module.exports = {
  getAiConfig,
  isAiEnabled,
  getEngineLabel,
  getLastError,
  callAiJson,
  extractJson
};
