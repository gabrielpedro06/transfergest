import { COMPANY_FIELDS, getSupabaseReadClient } from "./_shared.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const q = String(req.query?.q || "").trim();

  try {
    const { supabase } = getSupabaseReadClient();

    let query = supabase
      .from("transfergest_registos")
      .select(COMPANY_FIELDS)
      .order("denominacao", { ascending: true })
      .limit(120);

    if (q) {
      const safeQuery = q.replaceAll(",", " ").replaceAll("%", "").replaceAll("*", "").trim();
      query = query.or(
        `denominacao.ilike.%${safeQuery}%,numero_contribuinte.ilike.%${safeQuery}%,sede_localidade.ilike.%${safeQuery}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }

    res.status(200).json({ ok: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Unexpected error" });
  }
}
