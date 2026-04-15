# TransferGest Landing

Landing page publica (sem login) para pedido de contacto/reuniao.

## Fluxo implementado

1. O utilizador seleciona a empresa (a partir de TODAS as empresas em `transfergest_registos`).
2. Preenche:
   - contacto telefonico
   - horario para contacto
3. Ao submeter:
   - o registo passa para estado `reuniao`
   - `estado_historico.reuniao` e atualizado com a data atual
   - `ultimo_contacto_em` e atualizado
   - e adicionada nota em `observacoes` com os dados do formulario
   - e enviado email automatico para `sales@transfergest.com` com:
     - dados preenchidos
     - dados completos da empresa na BD

## Estrutura

- `src/` frontend (Vite + React)
- `api/companies.js` lista empresas
- `api/meeting-request.js` submissao do formulario + update BD + email

## Variaveis de ambiente

Copiar `.env.example` para `.env` e preencher:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_TRANSFERGEST_API_BASE` (opcional, por exemplo `http://localhost:8787`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TRANSFERGEST_BREVO_API_KEY`
- `TRANSFERGEST_BREVO_SENDER_EMAIL`
- `TRANSFERGEST_BREVO_SENDER_NAME`
- `TRANSFERGEST_NOTIFY_TO_EMAIL`

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Projetado para Vercel (usa pasta `api/` para funcoes serverless).
