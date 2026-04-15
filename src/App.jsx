import { useEffect, useMemo, useState } from "react";
import { fetchCompanies, submitMeetingRequest } from "./services/api";

function formatCompanyOption(company) {
  return String(company.denominacao || "").trim();
}

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [phone, setPhone] = useState("");
  const [contactWindow, setContactWindow] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchCompanies(search);
        if (!cancelled) {
          setCompanies(data);
          if (!search.trim() && data.length === 0) {
            setFeedback({
              type: "error",
              text: "Nao ha empresas visiveis com estas credenciais. Configure SUPABASE_SERVICE_ROLE_KEY ou uma policy SELECT para transfergest_registos.",
            });
          } else if (data.length > 0) {
            setFeedback(null);
          }
          if (!companyId && data.length > 0) {
            setCompanyId(data[0].id);
          } else if (companyId && data.length > 0 && !data.some((item) => item.id === companyId)) {
            setCompanyId(data[0].id);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback({ type: "error", text: error.message || "Falha ao carregar empresas." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeout = setTimeout(load, 220);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  const selectedCompany = useMemo(() => companies.find((item) => item.id === companyId) || null, [companies, companyId]);

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback(null);

    if (!companyId) {
      setFeedback({ type: "error", text: "Selecione uma empresa." });
      return;
    }

    if (!phone.trim()) {
      setFeedback({ type: "error", text: "Preencha o contacto telefónico." });
      return;
    }

    if (!contactWindow.trim()) {
      setFeedback({ type: "error", text: "Indique o horário para contacto." });
      return;
    }

    setSubmitting(true);
    try {
      await submitMeetingRequest({
        companyId,
        contactoTelefone: phone.trim(),
        horarioContacto: contactWindow.trim(),
      });

      setFeedback({ type: "success", text: "Pedido enviado com sucesso. A equipa TransferGest vai contactar brevemente." });
      setPhone("");
      setContactWindow("");
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Não foi possivel enviar o pedido." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="tg-page">
      <section className="tg-shell">
        <header className="tg-brand">
          <img src="src/images/logo-transfergestV.png" alt="TransferGest" className="tg-logo" />
          <h1>Vamos marcar a sua reunião</h1>
          <p>Selecione a empresa e diga-nos o melhor horário para ligarmos.</p>
        </header>

        <form className="tg-form" onSubmit={onSubmit}>
          <label htmlFor="companySearch">Pesquisar empresa</label>
          <input
            id="companySearch"
            type="text"
            placeholder="Escreva o nome, NIF ou localidade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />

          <label htmlFor="companyId">Nome da empresa</label>
          <select
            id="companyId"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            disabled={loading || companies.length === 0}
          >
            {companies.map((company) => (
              <option value={company.id} key={company.id}>
                {formatCompanyOption(company)}
              </option>
            ))}
          </select>

          <label htmlFor="phone">Contacto telefónico</label>
          <input
            id="phone"
            type="text"
            placeholder="(+351) 123 456 789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label htmlFor="window">Indique-nos o horário para lhe ligarmos</label>
          <input
            id="window"
            type="text"
            placeholder="Ex.: 13-15h00"
            value={contactWindow}
            onChange={(e) => setContactWindow(e.target.value)}
          />

          <button type="submit" disabled={submitting || !selectedCompany}>
            {submitting ? "A enviar..." : "Enviar horário"}
          </button>

          {feedback && <p className={`tg-feedback ${feedback.type}`}>{feedback.text}</p>}
        </form>
      </section>
    </main>
  );
}
