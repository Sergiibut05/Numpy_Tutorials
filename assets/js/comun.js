(function () {
  "use strict";

  const CLAVE_PROGRESO = "numpy-desde-cero:completadas";
  const PLACEHOLDER = "TU_USUARIO_GITHUB";

  function repositorio() {
    const cfg = window.CONFIG || {};
    const enPages = location.hostname.endsWith(".github.io");
    if (enPages) {
      const usuario = location.hostname.split(".")[0];
      const repo = location.pathname.split("/").filter(Boolean)[0] || cfg.github_repo;
      return { usuario, repo, rama: cfg.branch || "main" };
    }
    return { usuario: cfg.github_user, repo: cfg.github_repo, rama: cfg.branch || "main" };
  }

  function urlColab(slug) {
    const r = repositorio();
    return `https://colab.research.google.com/github/${r.usuario}/${r.repo}/blob/${r.rama}/notebooks/${slug}.ipynb`;
  }

  function colabConfigurado() {
    return repositorio().usuario && repositorio().usuario !== PLACEHOLDER;
  }

  function urlRepo() {
    const r = repositorio();
    return colabConfigurado() ? `https://github.com/${r.usuario}/${r.repo}` : null;
  }

  function leerProgreso() {
    try {
      return new Set(JSON.parse(localStorage.getItem(CLAVE_PROGRESO)) || []);
    } catch {
      return new Set();
    }
  }

  function guardarProgreso(conjunto) {
    try {
      localStorage.setItem(CLAVE_PROGRESO, JSON.stringify([...conjunto]));
    } catch {
      /* almacenamiento no disponible: el progreso no se recuerda */
    }
  }

  function alternarCompletada(slug) {
    const p = leerProgreso();
    p.has(slug) ? p.delete(slug) : p.add(slug);
    guardarProgreso(p);
    return p.has(slug);
  }

  function numero(slug) {
    return String(parseInt(slug, 10));
  }

  function el(etiqueta, atributos = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);
    for (const [k, v] of Object.entries(atributos)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") nodo.className = v;
      else if (k === "text") nodo.textContent = v;
      else if (k === "html") nodo.innerHTML = v;
      else if (k.startsWith("on")) nodo.addEventListener(k.slice(2), v);
      else nodo.setAttribute(k, v === true ? "" : v);
    }
    for (const h of hijos.flat()) {
      if (h === null || h === undefined || h === false) continue;
      nodo.append(h instanceof Node ? h : document.createTextNode(h));
    }
    return nodo;
  }

  function pintarPie() {
    const pie = document.getElementById("pie-repo");
    const url = urlRepo();
    if (pie && url) {
      pie.append("Código fuente y notebooks en ", el("a", { href: url, rel: "noopener" }, "GitHub"), ".");
    }
  }

  window.Curso = {
    urlColab, colabConfigurado, urlRepo, leerProgreso, alternarCompletada, numero, el, pintarPie,
  };
})();
