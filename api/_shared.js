import { createClient } from "@supabase/supabase-js";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const COMPANY_FIELDS = [
  "id",
  "denominacao",
  "nome",
  "contacto_telefone",
  "contacto_email",
  "numero_registo",
  "data_registo",
  "numero_contribuinte",
  "sede_endereco",
  "sede_codigo_postal",
  "sede_localidade",
  "sede_concelho",
  "sede_distrito",
  "ert_drt",
  "nut_ii",
  "nut_iii",
  "observacoes",
  "ano",
  "classificacao_transfergest",
  "interesse_email_marketing",
  "target",
  "estado",
  "estado_historico",
  "ultimo_contacto_em",
  "ativo",
  "created_at",
  "updated_at",
].join(",");

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
}

function createSupabaseServerClient(supabaseUrl, apiKey) {
  return createClient(supabaseUrl, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getNotificationRecipientEmail() {
  return process.env.TRANSFERGEST_NOTIFY_TO_EMAIL || "sales@transfergest.com";
}

export function getSupabaseAdmin() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias.");
  }

  return createSupabaseServerClient(supabaseUrl, serviceRoleKey);
}

export function getSupabaseReadClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const readKey = serviceRoleKey || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !readKey) {
    throw new Error("SUPABASE_URL e uma chave de acesso Supabase (anon ou service role) sao obrigatorias.");
  }

  return {
    supabase: createSupabaseServerClient(supabaseUrl, readKey),
    isServiceRole: Boolean(serviceRoleKey),
  };
}

export function buildStatusHistory(previous, nextStatus, dateIso) {
  const base = previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {};
  return {
    ...base,
    [nextStatus]: dateIso,
  };
}

export async function sendMeetingNotificationEmail({ company, formData }) {
  const apiKey = process.env.TRANSFERGEST_BREVO_API_KEY || process.env.BREVO_API_KEY;
  const senderEmail = process.env.TRANSFERGEST_BREVO_SENDER_EMAIL || "sales@transfergest.com";
  const senderName = process.env.TRANSFERGEST_BREVO_SENDER_NAME || "TransferGest";
  const toEmail = getNotificationRecipientEmail();

  if (!apiKey) {
    throw new Error("Configure TRANSFERGEST_BREVO_API_KEY ou BREVO_API_KEY no .env.");
  }

  const payload = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [{ email: toEmail }],
    subject: `Novo pedido de reuniao - ${company.denominacao || "TransferGest"}`,
    htmlContent: buildNotificationHtml(company, formData),
  };

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error("Falha ao enviar email de notificacao.");
    error.details = errorBody;
    throw error;
  }
}

function safeText(value) {
  return String(value ?? "").trim() || "-";
}

function row(label, value) {
  return `<tr><td style=\"padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;\">${label}</td><td style=\"padding:8px;border:1px solid #e2e8f0;\">${safeText(value)}</td></tr>`;
}

function buildNotificationHtml(company, formData) {
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.45;">
      <h2 style="margin:0 0 12px;">Novo formulario de reuniao TransferGest</h2>
      <p style="margin:0 0 16px;">Foi submetido um pedido de contacto na landing publica.</p>

      <h3 style="margin:14px 0 8px;">Dados preenchidos no formulario</h3>
      <table style="border-collapse:collapse;width:100%;max-width:760px;"> 
        ${row("Empresa selecionada", company.denominacao)}
        ${row("Contacto telefonico preenchido", formData.contactoTelefone)}
        ${row("Horario para contacto", formData.horarioContacto)}
      </table>

      <h3 style="margin:18px 0 8px;">Dados da empresa na base de dados</h3>
      <table style="border-collapse:collapse;width:100%;max-width:760px;"> 
        ${row("ID", company.id)}
        ${row("Denominacao", company.denominacao)}
        ${row("Nome", company.nome)}
        ${row("Contacto telefone", company.contacto_telefone)}
        ${row("Contacto email", company.contacto_email)}
        ${row("Numero registo", company.numero_registo)}
        ${row("Data registo", company.data_registo)}
        ${row("Numero contribuinte", company.numero_contribuinte)}
        ${row("Sede endereco", company.sede_endereco)}
        ${row("Sede codigo postal", company.sede_codigo_postal)}
        ${row("Sede localidade", company.sede_localidade)}
        ${row("Sede concelho", company.sede_concelho)}
        ${row("Sede distrito", company.sede_distrito)}
        ${row("ERT DRT", company.ert_drt)}
        ${row("NUT II", company.nut_ii)}
        ${row("NUT III", company.nut_iii)}
        ${row("Observacoes", company.observacoes)}
        ${row("Ano", company.ano)}
        ${row("Classificacao TransferGest", company.classificacao_transfergest)}
        ${row("Interesse email marketing", company.interesse_email_marketing ? "SIM" : "NAO")}
        ${row("Target", company.target)}
        ${row("Estado atual", company.estado)}
      </table>
    </div>
  `;
}
