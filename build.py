"""Genera los notebooks y los datos de la web a partir de contenido/*.md.

Uso:
    python build.py            # genera todo
    python build.py --sin-ejecutar   # no ejecuta el código (más rápido, sin salidas)

Formato de cada lección (contenido/NN-slug.md):

    ---
    titulo: Crear arrays
    resumen: Una frase que explica la lección.
    bloque: Primeros pasos
    duracion: 25 min
    objetivos: Primer objetivo | Segundo objetivo
    ---
    Texto en Markdown...

    ```python
    código que se convierte en una celda ejecutable
    ```

Etiquetas opcionales tras ```python:
    solucion  -> solución de un ejercicio (oculta en la web y en el notebook)
    error     -> se espera que la celda lance una excepción
    noexec    -> no se ejecuta al generar
"""

from __future__ import annotations

import ast
import base64
import contextlib
import gc
import html
import io
import json
import os
import re
import shutil
import sys
import tempfile
import traceback
import warnings
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
CONTENIDO = RAIZ / "contenido"
NOTEBOOKS = RAIZ / "notebooks"
DATOS = RAIZ / "assets" / "data"
IMAGENES = RAIZ / "assets" / "img" / "salidas"

FENCE_RE = re.compile(r"^```python(?P<tags>[^\n`]*)$")


def leer_config() -> dict:
    return json.loads((RAIZ / "config.json").read_text(encoding="utf-8"))


def parsear_leccion(ruta: Path) -> dict:
    texto = ruta.read_text(encoding="utf-8").replace("\r\n", "\n")
    if not texto.startswith("---\n"):
        raise ValueError(f"{ruta.name}: falta la cabecera ---")
    _, cabecera, cuerpo = texto.split("---\n", 2)
    meta = {}
    for linea in cabecera.strip().splitlines():
        clave, _, valor = linea.partition(":")
        meta[clave.strip()] = valor.strip()
    meta["objetivos"] = [o.strip() for o in meta.get("objetivos", "").split("|") if o.strip()]

    celdas: list[dict] = []
    md: list[str] = []
    codigo: list[str] | None = None
    tags: list[str] = []

    def cerrar_md():
        bloque = "\n".join(md).strip()
        if bloque:
            celdas.append({"tipo": "md", "src": bloque})
        md.clear()

    for linea in cuerpo.split("\n"):
        if codigo is None:
            m = FENCE_RE.match(linea.strip())
            if m:
                cerrar_md()
                codigo = []
                tags = m.group("tags").split()
            else:
                md.append(linea)
        elif linea.strip() == "```":
            tipo = "solucion" if "solucion" in tags else "code"
            celdas.append({
                "tipo": tipo,
                "src": "\n".join(codigo).strip("\n"),
                "error": "error" in tags,
                "noexec": "noexec" in tags,
            })
            codigo = None
        else:
            codigo.append(linea)
    if codigo is not None:
        raise ValueError(f"{ruta.name}: bloque de código sin cerrar")
    cerrar_md()

    return {"slug": ruta.stem, "meta": meta, "celdas": celdas}


class Ejecutor:
    """Ejecuta celdas en un espacio de nombres compartido, como un kernel de Jupyter."""

    def __init__(self, slug: str):
        self.slug = slug
        self.ns: dict = {"__name__": "__main__"}
        self.n_img = 0

    def ejecutar(self, src: str, se_espera_error: bool) -> list[dict]:
        salidas: list[dict] = []
        stdout = io.StringIO()
        arbol = ast.parse(src)
        ultima = None
        if arbol.body and isinstance(arbol.body[-1], ast.Expr):
            ultima = ast.Expression(arbol.body.pop().value)

        error = None
        with warnings.catch_warnings(record=True) as avisos:
            warnings.simplefilter("always")
            warnings.filterwarnings("ignore", message=".*non-interactive.*")
            try:
                with contextlib.redirect_stdout(stdout):
                    exec(compile(arbol, f"<{self.slug}>", "exec"), self.ns)
                    valor = eval(compile(ultima, f"<{self.slug}>", "eval"), self.ns) if ultima else None
            except Exception as exc:  # noqa: BLE001
                error = exc
                valor = None

        if stdout.getvalue():
            salidas.append({"tipo": "texto", "texto": stdout.getvalue().rstrip("\n")})
        for aviso in avisos:
            salidas.append({"tipo": "aviso", "texto": f"{aviso.category.__name__}: {aviso.message}"})

        if error is not None:
            if not se_espera_error:
                traceback.print_exception(error)
                raise RuntimeError(f"Error inesperado en {self.slug}:\n{src}")
            salidas.append({"tipo": "error", "texto": f"{type(error).__name__}: {error}"})
        elif se_espera_error:
            raise RuntimeError(f"Se esperaba un error en {self.slug}:\n{src}")
        elif valor is not None and not _es_artista_matplotlib(valor):
            salidas.append({"tipo": "resultado", "texto": repr(valor)})

        salidas.extend(self._figuras())
        return salidas

    def _figuras(self) -> list[dict]:
        if "matplotlib.pyplot" not in sys.modules:
            return []
        import matplotlib.pyplot as plt

        salidas = []
        for num in plt.get_fignums():
            self.n_img += 1
            nombre = f"{self.slug}-{self.n_img}.png"
            plt.figure(num).savefig(IMAGENES / nombre, dpi=110, bbox_inches="tight")
            salidas.append({"tipo": "imagen", "src": f"assets/img/salidas/{nombre}"})
        plt.close("all")
        return salidas


def _es_artista_matplotlib(valor) -> bool:
    modulo = type(valor).__module__ or ""
    if modulo.startswith("matplotlib"):
        return True
    if isinstance(valor, (list, tuple)) and valor:
        return all((type(v).__module__ or "").startswith("matplotlib") for v in valor)
    return False


def url_colab(cfg: dict, slug: str) -> str:
    return (f"https://colab.research.google.com/github/{cfg['github_user']}/{cfg['github_repo']}"
            f"/blob/{cfg['branch']}/notebooks/{slug}.ipynb")


def url_web(cfg: dict) -> str:
    return f"https://{cfg['github_user'].lower()}.github.io/{cfg['github_repo']}/"


def _lineas(texto: str) -> list[str]:
    partes = texto.split("\n")
    return [p + "\n" for p in partes[:-1]] + [partes[-1]]


def crear_notebook(leccion: dict, cfg: dict, siguiente: dict | None) -> dict:
    meta = leccion["meta"]
    cabecera = [
        f"[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)]({url_colab(cfg, leccion['slug'])})",
        "",
        f"# {meta['titulo']}",
        "",
        f"*{meta['bloque']} · {meta['duracion']}*",
        "",
        meta["resumen"],
    ]
    if meta["objetivos"]:
        cabecera += ["", "**Al terminar sabrás:**", ""] + [f"- {o}" for o in meta["objetivos"]]
    cabecera += ["", "> Ejecuta las celdas en orden con `Shift + Enter`. Si algo falla, "
                 "usa *Entorno de ejecución → Reiniciar y ejecutar todo*."]

    celdas = [{"cell_type": "markdown", "metadata": {}, "source": _lineas("\n".join(cabecera))}]

    def codigo(src):
        return {"cell_type": "code", "metadata": {}, "execution_count": None,
                "outputs": [], "source": _lineas(src)}

    for celda in leccion["celdas"]:
        if celda["tipo"] == "md":
            celdas.append({"cell_type": "markdown", "metadata": {}, "source": _lineas(celda["src"])})
        elif celda["tipo"] == "code":
            celdas.append(codigo(celda["src"]))
        else:
            celdas.append(codigo("# Escribe aquí tu solución\n"))
            solucion = (
                "<details>\n<summary><b>Ver una solución</b></summary>\n\n"
                f"<pre><code>{html.escape(celda['src'])}</code></pre>\n\n</details>"
            )
            celdas.append({"cell_type": "markdown", "metadata": {}, "source": _lineas(solucion)})

    pie = ["---", ""]
    if siguiente:
        pie.append(f"**Siguiente lección:** [{siguiente['meta']['titulo']}]({url_colab(cfg, siguiente['slug'])})")
    else:
        pie.append("**¡Has terminado el curso!** Repasa los proyectos o vuelve a cualquier lección.")
    pie += ["", f"Versión web del curso: {url_web(cfg)}"]
    celdas.append({"cell_type": "markdown", "metadata": {}, "source": _lineas("\n".join(pie))})

    return {
        "cells": celdas,
        "metadata": {
            "colab": {"provenance": [], "toc_visible": True},
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def main():
    ejecutar = "--sin-ejecutar" not in sys.argv
    cfg = leer_config()
    lecciones = [parsear_leccion(p) for p in sorted(CONTENIDO.glob("*.md"))]

    NOTEBOOKS.mkdir(exist_ok=True)
    DATOS.mkdir(parents=True, exist_ok=True)
    if ejecutar:
        shutil.rmtree(IMAGENES, ignore_errors=True)
    IMAGENES.mkdir(parents=True, exist_ok=True)

    os.environ["MPLBACKEND"] = "Agg"
    carpeta_original = Path.cwd()

    for i, leccion in enumerate(lecciones):
        print(f"· {leccion['slug']}")
        if ejecutar:
            ejecutor = Ejecutor(leccion["slug"])
            with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
                os.chdir(tmp)
                try:
                    for celda in leccion["celdas"]:
                        if celda["tipo"] != "md" and not celda["noexec"]:
                            celda["salidas"] = ejecutor.ejecutar(celda["src"], celda["error"])
                finally:
                    ejecutor.ns.clear()
                    gc.collect()
                    os.chdir(carpeta_original)
            if "matplotlib.pyplot" in sys.modules:
                sys.modules["matplotlib.pyplot"].close("all")

        siguiente = lecciones[i + 1] if i + 1 < len(lecciones) else None
        nb = crear_notebook(leccion, cfg, siguiente)
        (NOTEBOOKS / f"{leccion['slug']}.ipynb").write_text(
            json.dumps(nb, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

        datos = {
            "slug": leccion["slug"],
            "meta": leccion["meta"],
            "celdas": [{k: v for k, v in c.items() if k in ("tipo", "src", "salidas", "error")}
                       for c in leccion["celdas"]],
        }
        (DATOS / f"{leccion['slug']}.js").write_text(
            "window.LECCION = " + json.dumps(datos, ensure_ascii=False) + ";\n", encoding="utf-8")

    indice = [{
        "slug": l["slug"],
        "titulo": l["meta"]["titulo"],
        "resumen": l["meta"]["resumen"],
        "bloque": l["meta"]["bloque"],
        "duracion": l["meta"]["duracion"],
        "ejercicios": sum(c["tipo"] == "solucion" for c in l["celdas"]),
    } for l in lecciones]
    config_web = {**cfg, "colab_base": url_colab(cfg, "").rsplit("/", 1)[0] + "/"}
    (DATOS / "indice.js").write_text(
        "window.CONFIG = " + json.dumps(config_web, ensure_ascii=False) + ";\n"
        "window.INDICE = " + json.dumps(indice, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8")

    print(f"\n{len(lecciones)} lecciones generadas.")


if __name__ == "__main__":
    main()
