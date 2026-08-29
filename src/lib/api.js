// Backend API helper — talks to our FastAPI backend.

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000/api/v1'

/**
 * Send several Map-API routes to our backend for analysis
 * (traffic ML + events + weather + LLM). Returns the full JSON response.
 */
export async function analyzeRoutes(payloadRoutes) {
  const response = await fetch(`${BACKEND_URL}/analyze-routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ routes: payloadRoutes }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Backend error ${response.status}: ${text.slice(0, 300)}`,
    )
  }
  return response.json()
}

export { BACKEND_URL }
