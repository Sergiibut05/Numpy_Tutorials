(function () {
  "use strict";
  const { el, urlColab, leerProgreso, numero, pintarPie } = window.Curso;

  /* ---------- Rejilla interactiva ---------- */

  const FILAS = 5;
  const COLS = 6;
  const valor = (i, j) => i * COLS + j + 1;

  const EXPRESIONES = [
    { codigo: "a[1, 4]", forma: "escalar", sel: (i, j) => i === 1 && j === 4,
      nota: "Un solo elemento: fila 1, columna 4." },
    { codigo: "a[2]", forma: "1d", sel: (i) => i === 2,
      nota: "Una fila entera. Equivale a a[2, :]." },
    { codigo: "a[:, 3]", forma: "1d", sel: (i, j) => j === 3,
      nota: "Una columna: todas las filas, columna 3." },
    { codigo: "a[1:4, 2:5]", forma: "2d", sel: (i, j) => i >= 1 && i < 4 && j >= 2 && j < 5,
      nota: "Un bloque. El final del slice no se incluye." },
    { codigo: "a[::2, ::2]", forma: "2d", sel: (i, j) => i % 2 === 0 && j % 2 === 0,
      nota: "Una fila sí y otra no, una columna sí y otra no." },
    { codigo: "a[a % 7 == 0]", forma: "1d", sel: (i, j) => valor(i, j) % 7 === 0,
      nota: "Máscara booleana: los múltiplos de 7, en un array 1D." },
    { codigo: "a[-1, ::-1]", forma: "1d", sel: (i) => i === FILAS - 1, invertir: true,
      nota: "La última fila, recorrida al revés." },
  ];

  const rejilla = document.getElementById("demo-rejilla");
  const botonera = document.getElementById("demo-expresiones");
  const salida = document.getElementById("demo-resultado");
  const celdas = [];

  for (let i = 0; i < FILAS; i++) {
    for (let j = 0; j < COLS; j++) {
      const c = el("span", { class: "dato", text: String(valor(i, j)) });
      c.style.setProperty("--i", i);
      c.style.setProperty("--j", j);
      rejilla.append(c);
      celdas.push({ i, j, nodo: c });
    }
  }

  function formatear(expr) {
    const elegidas = celdas.filter((c) => expr.sel(c.i, c.j));
    if (expr.forma === "escalar") return `np.int64(${valor(elegidas[0].i, elegidas[0].j)})`;
    if (expr.forma === "1d") {
      let vals = elegidas.map((c) => valor(c.i, c.j));
      if (expr.invertir) vals = vals.reverse();
      return `array([${vals.join(", ")}])`;
    }
    const porFila = new Map();
    for (const c of elegidas) {
      if (!porFila.has(c.i)) porFila.set(c.i, []);
      porFila.get(c.i).push(String(valor(c.i, c.j)).padStart(2));
    }
    const filas = [...porFila.values()].map((f) => `[${f.join(", ")}]`);
    return `array([${filas.join(",\n       ")}])`;
  }

  function seleccionar(indice, porUsuario) {
    const expr = EXPRESIONES[indice];
    botonera.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-pressed", String(k === indice)));
    for (const c of celdas) c.nodo.classList.toggle("seleccionada", expr.sel(c.i, c.j));
    salida.replaceChildren(
      el("pre", { class: "demo-valor" }, el("code", { text: formatear(expr) })),
      el("p", { class: "demo-nota", text: expr.nota }),
    );
    if (porUsuario) detenerCiclo();
  }

  EXPRESIONES.forEach((expr, k) => {
    botonera.append(el("button", {
      type: "button", class: "chip", "aria-pressed": "false",
      onclick: () => seleccionar(k, true),
    }, el("code", { text: expr.codigo })));
  });

  let actual = 3;
  let temporizador = null;
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function detenerCiclo() {
    clearInterval(temporizador);
    temporizador = null;
  }

  seleccionar(actual, false);
  if (!reducirMovimiento) {
    temporizador = setInterval(() => {
      actual = (actual + 1) % EXPRESIONES.length;
      seleccionar(actual, false);
    }, 3200);
    document.querySelector(".demo").addEventListener("pointerenter", detenerCiclo, { once: true });
  }

  /* ---------- Temario ---------- */

  const indice = window.INDICE || [];
  const progreso = leerProgreso();
  const temario = document.getElementById("temario");
  const bloques = [...new Set(indice.map((l) => l.bloque))];

  for (const bloque of bloques) {
    const lista = el("ol", { class: "lecciones" });
    for (const l of indice.filter((x) => x.bloque === bloque)) {
      const hecha = progreso.has(l.slug);
      lista.append(el("li", { class: "leccion-fila" + (hecha ? " hecha" : "") },
        el("span", { class: "leccion-num", "aria-hidden": "true" }, numero(l.slug)),
        el("div", { class: "leccion-cuerpo" },
          el("h4", {}, el("a", { href: `leccion.html?l=${l.slug}` }, l.titulo)),
          el("p", { text: l.resumen }),
        ),
        el("div", { class: "leccion-meta" },
          el("span", { text: l.duracion }),
          l.ejercicios ? el("span", { text: `${l.ejercicios} ejercicios` }) : null,
          hecha ? el("span", { class: "marca-hecha", text: "Completada" }) : null,
          el("a", { class: "enlace-colab", href: urlColab(l.slug), rel: "noopener", target: "_blank" }, "Colab"),
        ),
      ));
    }
    temario.append(el("div", { class: "bloque" }, el("h3", { class: "bloque-titulo", text: bloque }), lista));
  }

  /* ---------- Progreso ---------- */

  if (progreso.size) {
    const siguiente = indice.find((l) => !progreso.has(l.slug));
    const texto = document.getElementById("hero-progreso");
    texto.hidden = false;
    texto.textContent = `Llevas ${progreso.size} de ${indice.length} lecciones completadas.`;
    if (siguiente) {
      const boton = document.getElementById("boton-empezar");
      boton.href = `leccion.html?l=${siguiente.slug}`;
      boton.textContent = `Seguir con la lección ${numero(siguiente.slug)}`;
    }
  }

  pintarPie();
})();
