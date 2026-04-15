import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function patchResponse(res) {
  if (typeof res.status !== "function") {
    res.status = function status(code) {
      res.statusCode = code;
      return res;
    };
  }

  if (typeof res.json !== "function") {
    res.json = function json(payload) {
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify(payload));
    };
  }

  return res;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("JSON invalido no corpo do pedido."));
      }
    });
    req.on("error", reject);
  });
}

function transfergestLocalApiPlugin() {
  return {
    name: "transfergest-local-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/companies", async (req, res) => {
        const wrappedRes = patchResponse(res);

        try {
          const url = new URL(req.url || "", "http://localhost");
          req.query = Object.fromEntries(url.searchParams.entries());
          const { default: companiesHandler } = await import("./api/companies.js");
          await companiesHandler(req, wrappedRes);
        } catch (error) {
          wrappedRes.status(500).json({ ok: false, error: error.message || "Unexpected error" });
        }
      });

      server.middlewares.use("/api/meeting-request", async (req, res) => {
        const wrappedRes = patchResponse(res);

        try {
          req.body = await readJsonBody(req);
          const { default: meetingRequestHandler } = await import("./api/meeting-request.js");
          await meetingRequestHandler(req, wrappedRes);
        } catch (error) {
          wrappedRes.status(500).json({ ok: false, error: error.message || "Unexpected error" });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [react(), transfergestLocalApiPlugin()],
  };
});
