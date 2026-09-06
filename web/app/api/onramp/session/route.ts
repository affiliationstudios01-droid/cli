import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const gatewayUrl = process.env.TOTALITY_GATEWAY_URL || "http://localhost:8787"
  const body = await request.json()
  const response = await fetch(`${gatewayUrl}/api/onramp/session`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: request.headers.get("authorization") || "" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const payload = await response.json()
  return NextResponse.json(payload, { status: response.status })
}
