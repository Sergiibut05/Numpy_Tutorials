(function () {
  "use strict";

  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";

  const AYUDANTE = `
import ast, base64, io, json, os, sys, warnings, contextlib
os.environ["MPLBACKEND"] = "Agg"
_ns = {"__name__": "__main__"}

def _reiniciar():
    _ns.clear()
    _ns["__name__"] = "__main__"
    if "matplotlib.pyplot" in sys.modules:
        sys.modules["matplotlib.pyplot"].close("all")

def _es_artista(v):
    m = type(v).__module__ or ""
    if m.startswith("matplotlib"):
        return True
    return isinstance(v, (list, tuple)) and bool(v) and all((type(x).__module__ or "").startswith("matplotlib") for x in v)

def _figuras():
    if "matplotlib.pyplot" not in sys.modules:
        return []
    plt = sys.modules["matplotlib.pyplot"]
    salidas = []
    for n in plt.get_fignums():
        buf = io.BytesIO()
        plt.figure(n).savefig(buf, format="png", dpi=110, bbox_inches="tight")
        salidas.append({"tipo": "imagen", "src": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()})
    plt.close("all")
    return salidas

def _ejecutar(src):
    salidas = []
    stdout = io.StringIO()
    try:
        arbol = ast.parse(src)
    except SyntaxError as e:
        return json.dumps([{"tipo": "error", "texto": f"SyntaxError: {e.msg} (línea {e.lineno})"}])
    ultima = None
    if arbol.body and isinstance(arbol.body[-1], ast.Expr):
        ultima = ast.Expression(arbol.body.pop().value)
    error = valor = None
    with warnings.catch_warnings(record=True) as avisos:
        warnings.simplefilter("always")
        warnings.filterwarnings("ignore", message=".*non-interactive.*")
        try:
            with contextlib.redirect_stdout(stdout):
                exec(compile(arbol, "<celda>", "exec"), _ns)
                if ultima is not None:
                    valor = eval(compile(ultima, "<celda>", "eval"), _ns)
        except Exception as e:
            error = e
    if stdout.getvalue():
        salidas.append({"tipo": "texto", "texto": stdout.getvalue().rstrip("\\n")})
    for a in avisos:
        salidas.append({"tipo": "aviso", "texto": f"{a.category.__name__}: {a.message}"})
    if error is not None:
        salidas.append({"tipo": "error", "texto": f"{type(error).__name__}: {error}"})
    elif valor is not None and not _es_artista(valor):
        salidas.append({"tipo": "resultado", "texto": repr(valor)})
    salidas.extend(_figuras())
    return json.dumps(salidas)
`;

  let promesa = null;
  const cargados = new Set();

  function cargarScript(src) {
    return new Promise((ok, fallo) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = () => fallo(new Error("No se pudo descargar Pyodide. Comprueba tu conexión."));
      document.head.append(s);
    });
  }

  function iniciar(alProgresar) {
    if (!promesa) {
      promesa = (async () => {
        alProgresar?.("Descargando Python para el navegador…");
        await cargarScript(PYODIDE + "pyodide.js");
        const py = await window.loadPyodide({ indexURL: PYODIDE });
        alProgresar?.("Instalando NumPy…");
        await py.loadPackage("numpy");
        py.runPython(AYUDANTE);
        return py;
      })();
      promesa.catch(() => { promesa = null; });
    }
    return promesa;
  }

  async function prepararPaquetes(py, codigo, alProgresar) {
    if (/matplotlib|plt\./.test(codigo) && !cargados.has("matplotlib")) {
      alProgresar?.("Instalando matplotlib…");
      await py.loadPackage("matplotlib");
      cargados.add("matplotlib");
    }
    if (/https?:\/\//.test(codigo) && !cargados.has("http")) {
      await py.loadPackage("pyodide-http");
      py.runPython("import pyodide_http; pyodide_http.patch_all()");
      cargados.add("http");
    }
  }

  async function ejecutar(codigo, alProgresar) {
    const py = await iniciar(alProgresar);
    await prepararPaquetes(py, codigo, alProgresar);
    const fn = py.globals.get("_ejecutar");
    try {
      return JSON.parse(fn(codigo));
    } finally {
      fn.destroy();
    }
  }

  async function reiniciar() {
    if (!promesa) return;
    const py = await promesa;
    py.runPython("_reiniciar()");
  }

  window.PythonNavegador = { ejecutar, reiniciar, iniciar };
})();
