const API_BASE = import.meta.env.VITE_TRANSFERGEST_API_BASE || import.meta.env.VITE_API_BASE || "";

async function parseResponse(response) {
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) {
    const message = json?.error || "Pedido falhou.";
    const error = new Error(message);
    error.status = response.status;
    error.details = json?.details || null;
    throw error;
  }
  return json;
}

export async function fetchCompanies(query = "") {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());

  const endpoint = `${API_BASE}/api/companies${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(endpoint, { method: "GET" });
  const json = await parseResponse(response);
  return json.data || [];
}

export async function submitMeetingRequest(payload) {
  const endpoint = `${API_BASE}/api/meeting-request`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseResponse(response);
  return json;
}
