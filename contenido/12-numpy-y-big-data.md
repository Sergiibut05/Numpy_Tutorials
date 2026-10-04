---
titulo: NumPy con datos grandes
resumen: Qué hacer cuando los datos empiezan a no caber en memoria. Elegir bien los tipos, evitar copias, procesar por bloques, usar memmap y saber cuándo pasar a otras herramientas.
bloque: Herramientas
duracion: 35 min
objetivos: Estimar cuánta memoria necesita un array | Reducir memoria con dtypes y operaciones in place | Procesar datos que no caben en RAM con bloques y memmap
---
```python
import numpy as np
import time
```

Si vienes del mundo Big Data conocerás las **5 V**: Volumen, Velocidad, Variedad, Veracidad y Valor. NumPy ayuda sobre todo con dos de ellas:

- **Volumen:** representar muchos datos de forma compacta.
- **Velocidad:** procesarlos rápido gracias a la vectorización.

(La **Veracidad**, es decir, datos sucios y huecos, la tratamos con máscaras y `nan` en las lecciones 4 y 7.)

NumPy trabaja **en memoria RAM** y en **una sola máquina**. Esta lección va de exprimir eso al máximo y de reconocer cuándo se queda corto.

## 1. Calcula antes de crear

La memoria de un array es fácil de predecir: **número de elementos × bytes por elemento**.

```python
def memoria(shape, dtype):
    n = np.prod(shape, dtype=np.int64)
    return n * np.dtype(dtype).itemsize / 1e9   # en GB

# 100 millones de filas × 10 columnas
print(f"float64: {memoria((100_000_000, 10), np.float64):.1f} GB")
print(f"float32: {memoria((100_000_000, 10), np.float32):.1f} GB")
print(f"int8:    {memoria((100_000_000, 10), np.int8):.1f} GB")
```

Un Colab gratuito tiene unos 12 GB de RAM. Hacer esta cuenta antes de cargar nada te ahorra muchos cuelgues.

## 2. Elige el tipo más pequeño que sirva

| Dato | Tipo razonable |
|---|---|
| edades, notas de 0 a 10, píxeles | `uint8` (0-255) |
| años, códigos postales | `int16` / `int32` |
| medidas de sensores, precios aproximados | `float32` |
| cálculos científicos que necesitan precisión | `float64` |
| sí/no | `bool` |

```python
rng = np.random.default_rng(0)
edades = rng.integers(0, 100, size=10_000_000)
print(edades.dtype, f"{edades.nbytes / 1e6:.0f} MB")

edades_peq = edades.astype(np.uint8)
print(edades_peq.dtype, f"{edades_peq.nbytes / 1e6:.0f} MB")
```

Ocho veces menos memoria con exactamente la misma información. Recuerda la contrapartida de la lección 3: con tipos pequeños, cuidado con el desbordamiento al hacer cuentas.

```python
print(edades_peq.sum())                       # NumPy usa un acumulador grande para sum: correcto
print((edades_peq * 3)[:5], "← ¡desbordamiento!")
print((edades_peq.astype(np.int32) * 3)[:5])
```

## 3. Evita copias y temporales

Cada operación intermedia crea un array nuevo del mismo tamaño. En `a * 2 + b * 3` se crean **tres** arrays temporales. Con datos grandes eso puede triplicar el pico de memoria.

Las opciones para evitarlo:

- **Operadores in place** (`+=`, `*=`...), que modifican el array existente.
- El parámetro **`out=`** de las ufuncs, que escribe el resultado en un array que ya existe.
- **Vistas** (slicing) en lugar de copias.

```python
n = 20_000_000
a = np.ones(n)
b = np.ones(n)

inicio = time.perf_counter()
r = a * 2 + b * 3
t1 = time.perf_counter() - inicio

inicio = time.perf_counter()
r = np.multiply(a, 2)       # un único array de resultado
r += b * 3                  # un temporal menos
t2 = time.perf_counter() - inicio

inicio = time.perf_counter()
np.multiply(a, 2, out=r)    # reutiliza r: ningún array nuevo para el resultado
np.add(r, np.multiply(b, 3), out=r)
t3 = time.perf_counter() - inicio

print(f"Con temporales: {t1:.3f}s | in place: {t2:.3f}s | con out=: {t3:.3f}s")
del a, b, r
```

## 4. La memoria es una fila: el orden importa

Un array 2D se guarda en memoria como una fila larga de números, **fila tras fila** (orden "C"). Recorrer los datos en ese orden es más rápido, porque el procesador lee bloques de memoria contiguos (la **caché**).

```python
m = np.ones((5000, 5000))
print(m.flags["C_CONTIGUOUS"], m.strides)   # strides: bytes que hay que saltar para avanzar en cada eje
```

`strides = (40000, 8)` significa que para bajar una fila hay que saltar 40 000 bytes y para avanzar una columna, solo 8.

```python
inicio = time.perf_counter()
for i in range(m.shape[0]):
    m[i, :].sum()           # filas: memoria contigua
t_filas = time.perf_counter() - inicio

inicio = time.perf_counter()
for j in range(m.shape[1]):
    m[:, j].sum()           # columnas: saltos de 40 000 bytes
t_cols = time.perf_counter() - inicio

print(f"Por filas: {t_filas:.3f}s | por columnas: {t_cols:.3f}s")
del m
```

Por supuesto, lo más rápido es no usar el bucle: `m.sum(axis=1)` ya recorre la memoria en el orden óptimo.

## 5. Procesar por bloques (*chunking*)

Si el resultado que buscas es una agregación (suma, media, máximo, conteos...), no necesitas tener todos los datos a la vez: puedes procesarlos **por trozos** y combinar los resultados parciales. Es la misma idea que hay detrás de MapReduce.

```python
def media_por_bloques(generar_bloque, n_bloques):
    suma, cuenta = 0.0, 0
    for i in range(n_bloques):
        bloque = generar_bloque(i)        # en la vida real: leer un trozo del fichero
        suma += bloque.sum()
        cuenta += bloque.size
    return suma / cuenta

rng = np.random.default_rng(42)
media = media_por_bloques(lambda i: rng.normal(50, 10, size=1_000_000), n_bloques=20)
print(f"Media de 20 millones de valores sin tenerlos nunca todos en memoria: {media:.3f}")
```

La media y la suma se combinan fácil. Otras, como la mediana, no: necesitarías algoritmos aproximados.

## 6. `np.memmap`: arrays que viven en disco

Un **memmap** es un array cuyo contenido está en un fichero. NumPy carga en RAM solo las partes que vas tocando. Con él puedes trabajar con ficheros más grandes que tu memoria, usando la sintaxis de siempre.

```python
filas, cols = 1_000_000, 8

# Crear un fichero de ~32 MB y rellenarlo por bloques
mm = np.memmap("sensores.dat", dtype=np.float32, mode="w+", shape=(filas, cols))
rng = np.random.default_rng(0)
for inicio in range(0, filas, 250_000):
    mm[inicio:inicio + 250_000] = rng.normal(20, 5, size=(250_000, cols))
mm.flush()      # asegura que todo está escrito en disco
del mm
```

```python
# Abrirlo más tarde en solo lectura: no se carga nada todavía
datos = np.memmap("sensores.dat", dtype=np.float32, mode="r", shape=(filas, cols))
print(type(datos).__name__, datos.shape)

# Solo se leen del disco las filas que tocas
print(datos[500_000:500_003])
print("Media de la columna 0:", datos[:, 0].mean())
```

> `.npy` también admite este modo: `np.load("fichero.npy", mmap_mode="r")`.

## 7. Cuándo NumPy ya no basta

| Situación | Herramienta |
|---|---|
| tablas con columnas de distintos tipos, fechas, agrupar | **pandas** o **Polars** |
| datos que no caben en una máquina, o en paralelo | **Dask** (API casi igual que NumPy), **Spark** |
| cálculo masivo en GPU | **CuPy**, **JAX**, **PyTorch** |
| ficheros enormes con estructura | **HDF5** (`h5py`), **Zarr**, **Parquet** |

Lo bueno es que todas ellas hablan "idioma NumPy". Lo que has aprendido en este curso (shapes, ejes, broadcasting, vectorización) se transfiere casi directamente.

## Ejercicios

**1.** Un dataset tiene 50 millones de filas y 3 columnas: edad (0-120), salario en euros (hasta 10 millones, sin decimales) y una puntuación decimal. ¿Qué dtype elegirías para cada columna y cuánta memoria ocuparía en total? Compáralo con usar `float64` para todo.

```python solucion
n = 50_000_000
total = n * (np.dtype(np.uint8).itemsize       # edad
             + np.dtype(np.int32).itemsize     # salario (int32 llega a ~2100 millones)
             + np.dtype(np.float32).itemsize)  # puntuación
print(f"Optimizado: {total / 1e9:.2f} GB")
print(f"Todo float64: {n * 3 * 8 / 1e9:.2f} GB")
```

**2.** Calcula el máximo y el mínimo de 10 millones de valores aleatorios procesándolos en 10 bloques de un millón.

```python solucion
rng = np.random.default_rng(1)
maximo, minimo = -np.inf, np.inf
for _ in range(10):
    bloque = rng.normal(size=1_000_000)
    maximo = max(maximo, bloque.max())
    minimo = min(minimo, bloque.min())
print(maximo, minimo)
```

**3.** Abre `sensores.dat` como memmap y calcula la media de **cada columna** procesando de 100 000 en 100 000 filas.

```python solucion
datos = np.memmap("sensores.dat", dtype=np.float32, mode="r", shape=(filas, cols))
suma = np.zeros(cols, dtype=np.float64)
for inicio in range(0, filas, 100_000):
    suma += datos[inicio:inicio + 100_000].sum(axis=0, dtype=np.float64)
suma / filas
```
