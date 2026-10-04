# NumPy desde cero

Curso de NumPy en español para quien sabe Python básico y nada de NumPy. Son 15 lecciones con ejercicios, publicadas como página web y como notebooks que se abren en Google Colab.

| # | Lección | Notebook |
|---|---|---|
| 1 | ¿Por qué NumPy? | [`01-por-que-numpy.ipynb`](notebooks/01-por-que-numpy.ipynb) |
| 2 | Crear arrays | [`02-crear-arrays.ipynb`](notebooks/02-crear-arrays.ipynb) |
| 3 | Forma, tamaño y tipos de datos | [`03-tipos-y-atributos.ipynb`](notebooks/03-tipos-y-atributos.ipynb) |
| 4 | Indexado y slicing | [`04-indexado-y-slicing.ipynb`](notebooks/04-indexado-y-slicing.ipynb) |
| 5 | Operaciones vectorizadas | [`05-operaciones-vectorizadas.ipynb`](notebooks/05-operaciones-vectorizadas.ipynb) |
| 6 | Broadcasting | [`06-broadcasting.ipynb`](notebooks/06-broadcasting.ipynb) |
| 7 | Agregaciones y estadística | [`07-agregaciones-y-estadistica.ipynb`](notebooks/07-agregaciones-y-estadistica.ipynb) |
| 8 | Cambiar la forma y combinar arrays | [`08-forma-y-combinacion.ipynb`](notebooks/08-forma-y-combinacion.ipynb) |
| 9 | Números aleatorios y simulación | [`09-numeros-aleatorios.ipynb`](notebooks/09-numeros-aleatorios.ipynb) |
| 10 | Álgebra lineal | [`10-algebra-lineal.ipynb`](notebooks/10-algebra-lineal.ipynb) |
| 11 | Guardar y cargar datos | [`11-guardar-y-cargar.ipynb`](notebooks/11-guardar-y-cargar.ipynb) |
| 12 | NumPy con datos grandes | [`12-numpy-y-big-data.ipynb`](notebooks/12-numpy-y-big-data.ipynb) |
| 13 | Proyecto: la ley de Moore con datos reales | [`13-proyecto-ley-de-moore.ipynb`](notebooks/13-proyecto-ley-de-moore.ipynb) |
| 14 | Proyecto: imágenes como arrays | [`14-proyecto-imagenes.ipynb`](notebooks/14-proyecto-imagenes.ipynb) |
| 15 | Proyecto: fractales | [`15-proyecto-fractales.ipynb`](notebooks/15-proyecto-fractales.ipynb) |

## Cómo está organizado

```text
contenido/        Lecciones en Markdown: la única fuente que se edita a mano
build.py          Genera notebooks y datos de la web, y ejecuta todo el código para verificarlo
config.json       Usuario y repositorio de GitHub (para los enlaces de Colab)
notebooks/        Notebooks generados (.ipynb)
index.html        Portada de la web
leccion.html      Página de cada lección (?l=slug)
assets/           CSS, JavaScript, datos generados y gráficos generados
```

Los notebooks y `assets/data` / `assets/img/salidas` se **generan**: no los edites a mano, edita `contenido/` y vuelve a generar.

## Editar o añadir lecciones

Cada lección es un fichero `contenido/NN-slug.md` con una cabecera y Markdown normal. Los bloques ` ```python ` se convierten en celdas ejecutables. Etiquetas opcionales:

- ` ```python solucion `: solución de un ejercicio. En la web aparece oculta, junto a un editor vacío; en el notebook, como celda vacía seguida de un desplegable con la solución.
- ` ```python error `: se espera que la celda lance una excepción (para enseñar errores).
- ` ```python noexec `: no se ejecuta al generar (por ejemplo, código exclusivo de Colab).

Después de editar:

```bash
pip install numpy matplotlib
python build.py
```

El script se detiene si alguna celda falla, así que todo lo publicado está comprobado.

## Probar la web en local

```bash
python -m http.server 8000
```

Y abre <http://localhost:8000>. Hace falta un servidor: abriendo `index.html` directamente, el navegador bloquea la carga de las lecciones.

## Créditos

- [NumPy tutorials](https://github.com/numpy/numpy-tutorials) (licencia BSD-3): los proyectos de la ley de Moore y de fractales están basados en sus tutoriales, y el CSV de transistores se descarga de ese repositorio.
- [NumPy: the absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html), [100 NumPy exercises](https://github.com/rougier/numpy-100), [From Python to NumPy](https://www.labri.fr/perso/nrougier/from-python-to-numpy/) y el [Python Data Science Handbook](https://jakevdp.github.io/PythonDataScienceHandbook/) como referencias.
- La ejecución en el navegador usa [Pyodide](https://pyodide.org/).
