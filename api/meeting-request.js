import {
  COMPANY_FIELDS,
  buildStatusHistory,
  getNotificationRecipientEmail,
  getSupabaseAdmin,
  sendMeetingNotificationEmail,
} from "./_shared.js";

export const config = {
  runtime: "nodejs",
};

function sanitizeText(value, maxLength = 120) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const companyId = sanitizeText(req.body?.companyId, 80);
  const contactoTelefone = sanitizeText(req.body?.contactoTelefone, 60);
  const horarioContacto = sanitizeText(req.body?.horarioContacto, 80);

  if (!companyId) {
    res.status(400).json({ ok: false, error: "companyId e obrigatorio." });
    return;
  }

  if (!contactoTelefone) {
    res.status(400).json({ ok: false, error: "contactoTelefone e obrigatorio." });
    return;
  }

  if (!horarioContacto) {
    res.status(400).json({ ok: false, error: "horarioContacto e obrigatorio." });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: company, error: companyError } = await supabase
      .from("transfergest_registos")
      .select(COMPANY_FIELDS)
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      res.status(404).json({ ok: false, error: "Empresa nao encontrada." });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const mergedHistory = buildStatusHistory(company.estado_historico, "reuniao", today);

    const mergedObservation = [
      String(company.observacoes || "").trim(),
      `\n[LANDING ${new Date().toISOString()}] Contacto telefonico: ${contactoTelefone} | Horario pedido: ${horarioContacto}`,
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    const updatePayload = {
      estado: "reuniao",
      estado_historico: mergedHistory,
      ultimo_contacto_em: today,
      observacoes: mergedObservation,
    };

    const { data: updatedCompany, error: updateError } = await supabase
      .from("transfergest_registos")
      .update(updatePayload)
      .eq("id", companyId)
      .select(COMPANY_FIELDS)
      .single();

    if (updateError) {
      res.status(500).json({ ok: false, error: updateError.message });
      return;
    }

    await sendMeetingNotificationEmail({
      company: updatedCompany,
      formData: {
        contactoTelefone,
        horarioContacto,
      },
    });

    res.status(200).json({
      ok: true,
      message: `Pedido registado e email enviado para ${getNotificationRecipientEmail()}.`,
      companyId,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || "Unexpected error",
      details: error.details || null,
    });
  }
}
