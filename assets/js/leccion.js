(function () {
  "use strict";
  const { el, urlColab, colabConfigurado, leerProgreso, alternarCompletada, numero } = window.Curso;

  const indice = window.INDICE || [];
  const slug = new URLSearchParams(location.search).get("l") || indice[0]?.slug;
  const posicion = indice.findIndex((l) => l.slug === slug);
  const contenido = document.getElementById("contenido");

  if (posicion === -1) {
    contenido.replaceChildren(
      el("h1", { text: "Esta lección no existe" }),
      el("p", {}, "Revisa el enlace o ", el("a", { href: "./#recorrido" }, "vuelve al temario"), "."),
    );
    return;
  }

  const script = document.createElement("script");
  script.src = `assets/data/${slug}.js`;
  script.onload = () => pintar(window.LECCION);
  script.onerror = () => {
    document.getElementById("cargando").textContent =
      "No se pudo cargar la lección. Si has abierto el archivo directamente, prueba con un servidor local (python -m http.server).";
  };
  document.head.append(script);

  /* ---------- Markdown con fórmulas ---------- */

  function markdown(src) {
    const formulas = [];
    const guardar = (tex, bloque) => {
      formulas.push(window.katex
        ? katex.renderToString(tex, { displayMode: bloque, throwOnError: false, strict: false })
        : tex);
      return `@@F${formulas.length - 1}@@`;
    };
    let texto = src
      .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => guardar(t, true))
      .replace(/\$([^$\n]+?)\$/g, (_, t) => guardar(t, false));
    let html = marked.parse(texto, { gfm: true });
    html = html.replace(/@@F(\d+)@@/g, (_, i) => formulas[Number(i)]);
    const caja = el("div", { class: "prosa", html });
    caja.querySelectorAll('a[href^="http"]').forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener";
    });
    caja.querySelectorAll("pre code").forEach((c) => {
      if (window.hljs && c.className.includes("language-python")) hljs.highlightElement(c);
    });
    return caja;
  }

  /* ---------- Celdas de código ---------- */

  const ejecutables = [];
  const aviso = document.getElementById("aviso-python");

  function mostrarAviso(texto) {
    aviso.hidden = !texto;
    aviso.textContent = texto || "";
  }

  function pintarSalidas(contenedor, salidas) {
    contenedor.replaceChildren();
    for (const s of salidas || []) {
      if (s.tipo === "imagen") {
        contenedor.append(el("img", { src: s.src, alt: "Gráfico generado por el código", loading: "lazy" }));
      } else {
        contenedor.append(el("pre", { class: `salida-${s.tipo}` }, s.texto));
      }
    }
    contenedor.hidden = !contenedor.childElementCount;
  }

  function resaltar(codigo) {
    const nodo = el("code", { class: "language-python", text: codigo });
    if (window.hljs) hljs.highlightElement(nodo);
    return nodo;
  }

  function crearCelda(celda, opciones = {}) {
    const { editable = false, opcional = false, marcador = "" } = opciones;
    let codigo = celda.src;
    let editando = editable;

    const pre = el("pre", { class: "codigo" }, resaltar(codigo));
    const area = el("textarea", {
      class: "codigo editor", spellcheck: "false", autocapitalize: "off",
      "aria-label": "Código editable", placeholder: marcador,
    });
    area.value = codigo;
    const ajustarAltura = () => {
      area.style.height = "auto";
      area.style.height = `${area.scrollHeight + 2}px`;
    };

    const salida = el("div", { class: "salida", "aria-live": "polite" });
    pintarSalidas(salida, celda.salidas);

    const botonEjecutar = el("button", { type: "button", class: "accion accion-ejecutar" }, "Ejecutar");
    const botonEditar = editable ? null : el("button", { type: "button", class: "accion" }, "Editar");
    const botonCopiar = el("button", { type: "button", class: "accion" }, "Copiar");

    const registro = {
      opcional,
      ejecutada: false,
      codigo: () => (editando ? area.value : codigo),
      salida,
    };
    ejecutables.push(registro);

    function alternarEdicion() {
      if (editando) {
        codigo = area.value;
        pre.replaceChildren(resaltar(codigo));
        area.replaceWith(pre);
        botonEditar.textContent = "Editar";
      } else {
        area.value = codigo;
        pre.replaceWith(area);
        ajustarAltura();
        area.focus();
        botonEditar.textContent = "Ver resaltado";
      }
      editando = !editando;
    }

    area.addEventListener("input", ajustarAltura);
    area.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        ejecutarCelda(registro, botonEjecutar);
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        area.setRangeText("    ", area.selectionStart, area.selectionEnd, "end");
        ajustarAltura();
      }
    });
    botonEjecutar.addEventListener("click", () => ejecutarCelda(registro, botonEjecutar));
    botonEditar?.addEventListener("click", alternarEdicion);
    botonCopiar.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(registro.codigo());
        botonCopiar.textContent = "Copiado";
      } catch {
        botonCopiar.textContent = "No se pudo copiar";
      }
      setTimeout(() => { botonCopiar.textContent = "Copiar"; }, 1600);
    });

    const nodo = el("div", { class: "celda" + (celda.error ? " celda-error-esperado" : "") },
      el("div", { class: "celda-codigo" },
        editable ? area : pre,
        el("div", { class: "celda-acciones" }, botonEjecutar, botonEditar, botonCopiar),
      ),
      salida,
    );
    if (editable) requestAnimationFrame(ajustarAltura);
    return nodo;
  }

  let ocupado = false;

  async function ejecutarCelda(registro, boton) {
    if (ocupado) return;
    ocupado = true;
    const textoOriginal = boton.textContent;
    boton.textContent = "Ejecutando…";
    boton.disabled = true;
    try {
      const posicionCelda = ejecutables.indexOf(registro);
      const pendientes = ejecutables.slice(0, posicionCelda).filter((r) => !r.ejecutada && !r.opcional);
      for (const [k, previa] of pendientes.entries()) {
        mostrarAviso(`Ejecutando las celdas anteriores (${k + 1} de ${pendientes.length})…`);
        await PythonNavegador.ejecutar(previa.codigo(), mostrarAviso);
        previa.ejecutada = true;
      }
      mostrarAviso(pendientes.length ? "Ejecutando…" : "");
      const salidas = await PythonNavegador.ejecutar(registro.codigo(), mostrarAviso);
      registro.ejecutada = true;
      pintarSalidas(registro.salida, salidas.length ? salidas : [{ tipo: "texto", texto: "(sin salida)" }]);
      registro.salida.classList.add("salida-viva");
      document.getElementById("boton-reiniciar").hidden = false;
      mostrarAviso("");
    } catch (err) {
      mostrarAviso(err.message || String(err));
    } finally {
      boton.textContent = textoOriginal;
      boton.disabled = false;
      ocupado = false;
    }
  }

  async function reiniciarPython() {
    await PythonNavegador.reiniciar();
    for (const r of ejecutables) r.ejecutada = false;
    mostrarAviso("Python reiniciado: las variables se han borrado.");
    setTimeout(() => mostrarAviso(""), 2500);
  }

  /* ---------- Página ---------- */

  function botonCompletada() {
    const boton = el("button", { type: "button", class: "boton boton-completar" });
    const actualizar = () => {
      const hecha = leerProgreso().has(slug);
      boton.setAttribute("aria-pressed", String(hecha));
      boton.textContent = hecha ? "Completada" : "Marcar como completada";
    };
    boton.addEventListener("click", () => {
      alternarCompletada(slug);
      document.querySelectorAll(".boton-completar").forEach((b) => b.dispatchEvent(new Event("actualizar")));
      pintarNavegacion();
    });
    boton.addEventListener("actualizar", actualizar);
    actualizar();
    return boton;
  }

  function botonesNotebook() {
    const colab = el("a", {
      class: "boton boton-principal", href: urlColab(slug), target: "_blank", rel: "noopener",
      title: colabConfigurado() || location.hostname.endsWith(".github.io")
        ? null : "Configura tu usuario de GitHub en config.json para que este enlace funcione",
    }, el("img", { src: "https://colab.research.google.com/img/colab_favicon_256px.png", alt: "", width: 18, height: 18 }), "Abrir en Colab");
    const descargar = el("a", {
      class: "boton boton-secundario", href: `notebooks/${slug}.ipynb`, download: `${slug}.ipynb`,
    }, "Descargar notebook");
    return [colab, descargar];
  }

  function pintarNavegacion() {
    const progreso = leerProgreso();
    const nav = document.getElementById("lateral-nav");
    nav.replaceChildren();
    for (const bloque of [...new Set(indice.map((l) => l.bloque))]) {
      const lista = el("ol", {});
      for (const l of indice.filter((x) => x.bloque === bloque)) {
        lista.append(el("li", { class: progreso.has(l.slug) ? "hecha" : null },
          el("a", { href: `leccion.html?l=${l.slug}`, "aria-current": l.slug === slug ? "page" : null },
            el("span", { class: "lateral-num", text: numero(l.slug) }),
            el("span", { text: l.titulo }),
          ),
        ));
      }
      nav.append(el("p", { class: "lateral-bloque", text: bloque }), lista);
    }

    const barra = document.getElementById("barra-progreso");
    const casillas = el("span", { class: "casillas", "aria-hidden": "true" },
      indice.map((l) => el("span", {
        class: "casilla" + (progreso.has(l.slug) ? " llena" : "") + (l.slug === slug ? " actual" : ""),
      })));
    barra.replaceChildren(casillas, el("span", { text: `${progreso.size} de ${indice.length} completadas` }));
  }

  function pintar(leccion) {
    const meta = leccion.meta;
    document.title = `${meta.titulo} · NumPy desde cero`;
    const anterior = indice[posicion - 1];
    const siguiente = indice[posicion + 1];

    const cabecera = el("header", { class: "leccion-cabecera" },
      el("p", { class: "leccion-contexto" },
        el("span", { text: `Lección ${numero(slug)} de ${indice.length}` }),
        el("span", { text: meta.bloque }),
        el("span", { text: meta.duracion }),
      ),
      el("h1", { text: meta.titulo }),
      el("p", { class: "leccion-resumen", text: meta.resumen }),
      meta.objetivos?.length
        ? el("div", { class: "objetivos" },
            el("h2", { text: "Al terminar sabrás" }),
            el("ul", {}, meta.objetivos.map((o) => el("li", { text: o }))))
        : null,
      el("div", { class: "leccion-acciones" }, botonesNotebook(), botonCompletada()),
    );

    const cuerpo = el("div", { class: "leccion-cuerpo-celdas" });
    for (const celda of leccion.celdas) {
      if (celda.tipo === "md") {
        cuerpo.append(markdown(celda.src));
      } else if (celda.tipo === "code") {
        cuerpo.append(crearCelda(celda));
      } else {
        cuerpo.append(el("div", { class: "ejercicio" },
          el("p", { class: "ejercicio-etiqueta", text: "Tu solución" }),
          crearCelda({ src: "" }, { editable: true, opcional: true, marcador: "# Escribe aquí tu código y pulsa Ejecutar (o Shift + Enter)" }),
          el("details", { class: "solucion" },
            el("summary", {}, "Ver una solución"),
            crearCelda(celda)),
        ));
      }
    }

    const pie = el("footer", { class: "leccion-pie" },
      el("div", { class: "leccion-pie-acciones" }, botonCompletada(), botonesNotebook()[0]),
      el("nav", { class: "anterior-siguiente", "aria-label": "Lecciones contiguas" },
        anterior
          ? el("a", { class: "contigua", href: `leccion.html?l=${anterior.slug}` },
              el("span", { class: "contigua-dir", text: "Anterior" }), el("span", { text: anterior.titulo }))
          : el("span", {}),
        siguiente
          ? el("a", { class: "contigua contigua-siguiente", href: `leccion.html?l=${siguiente.slug}` },
              el("span", { class: "contigua-dir", text: "Siguiente" }), el("span", { text: siguiente.titulo }))
          : el("a", { class: "contigua contigua-siguiente", href: "./#recorrido" },
              el("span", { class: "contigua-dir", text: "Fin del curso" }), el("span", { text: "Volver al temario" })),
      ),
    );

    const reiniciar = el("button", {
      type: "button", class: "boton-flotante", id: "boton-reiniciar", hidden: true,
      title: "Borra todas las variables de Python de esta página",
      onclick: reiniciarPython,
    }, "Reiniciar Python");

    contenido.replaceChildren(cabecera, cuerpo, pie);
    document.body.append(reiniciar);
    pintarNavegacion();

    if (window.matchMedia("(max-width: 960px)").matches) {
      document.getElementById("lateral-plegable").open = false;
    }
    const lateral = document.querySelector(".lateral");
    const enlaceActual = lateral.querySelector('a[aria-current="page"]');
    if (enlaceActual && lateral.scrollHeight > lateral.clientHeight) {
      lateral.scrollTop = enlaceActual.offsetTop - lateral.clientHeight / 2;
    }
  }
})();
