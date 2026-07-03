// Cliente HTTP mínimo hacia el backend FastAPI.
const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error((await res.json()).detail || res.statusText);
  return res.json();
}

export const api = {
  stats: () => request("/stats"),
  celdas: () => request("/ots/celdas"),
  registros: (filtros = {}) =>
    request(`/ots?${new URLSearchParams(filtros)}`),
  actualizarCompletados: (id, delta) =>
    request(`/ots/registros/${id}/completados?delta=${delta}`, { method: "PATCH" }),
  previsualizarImport: (archivo) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return request("/import/preview", { method: "POST", body: form });
  },
  confirmarImport: (payload) =>
    request("/import/confirm", { method: "POST", body: JSON.stringify(payload) }),
  optimizar: (payload) =>
    request("/nesting/optimizar", { method: "POST", body: JSON.stringify(payload) }),
};
