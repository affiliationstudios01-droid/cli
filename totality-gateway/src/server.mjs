import http from "node:http"
import crypto from "node:crypto"

const port = Number(process.env.PORT || 8787)
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").map((value) => value.trim()))
const rates = { ETH: 3420.18, BTC: 68420.12, USDC: 1 }

function json(response, status, payload, origin) {
  response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": allowedOrigins.has(origin) ? origin : "", "access-control-allow-headers": "content-type, authorization", "access-control-allow-methods": "GET,POST,OPTIONS" })
  response.end(JSON.stringify(payload))
}

async function recordLedger(event) {
  if (!supabaseUrl || !serviceRoleKey) return { recorded: false }
  const result = await fetch(`${supabaseUrl}/rest/v1/ledger_events`, { method: "POST", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "content-type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(event) })
  if (!result.ok) throw new Error(`Ledger write failed: ${result.status}`)
  return { recorded: true }
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || ""
  if (request.method === "OPTIONS") return json(response, 204, {}, origin)
  try {
    if (request.method === "GET" && request.url === "/health") return json(response, 200, { ok: true, service: "totality-gateway" }, origin)
    if (request.method === "POST" && request.url === "/api/onramp/session") {
      const body = await new Promise((resolve, reject) => { let raw = ""; request.on("data", (chunk) => raw += chunk); request.on("end", () => resolve(raw ? JSON.parse(raw) : {})); request.on("error", reject) })
      const { asset, amountUsd, network, paymentMethod, walletAddress } = body
      if (!rates[asset] || !Number.isFinite(Number(amountUsd)) || Number(amountUsd) < 10 || !network) return json(response, 400, { error: "Invalid purchase details" }, origin)
      const amount = Number(amountUsd)
      const sessionId = `tot_${crypto.randomUUID()}`
      const cryptoAmount = amount / rates[asset]
      const ledger = await recordLedger({ event_type: "onramp_session", asset, amount_usd: amount, crypto_amount: cryptoAmount, network, payment_method: paymentMethod || null, provider_session_id: sessionId, wallet_address: walletAddress || null, metadata: { secure_checkout: true, provider: "coinbase-cdp" } })
      return json(response, 201, { sessionId, asset, network, amountUsd: amount, cryptoAmount, checkoutUrl: process.env.COINBASE_CHECKOUT_URL || null, ledger }, origin)
    }
    return json(response, 404, { error: "Not found" }, origin)
  } catch (error) {
    console.error("[totality-gateway] request failed", error)
    return json(response, 500, { error: "Gateway request failed" }, origin)
  }
})
server.listen(port, () => console.log(`TOTALITY Gateway listening on :${port}`))
