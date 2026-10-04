---
titulo: Forma, tamaño y tipos de datos
resumen: Cómo preguntarle a un array cuántas dimensiones tiene, cuántos elementos guarda y de qué tipo son, y por qué el tipo importa para la memoria y la precisión.
bloque: Primeros pasos
duracion: 25 min
objetivos: Leer shape, ndim, size y dtype | Convertir entre tipos con astype | Entender el desbordamiento y la precisión de los decimales
---
```python
import numpy as np
```

## Los atributos de un array

Un array lleva consigo información sobre sí mismo. Estos son los atributos que más vas a consultar:

```python
notas = np.array([
    [7.5, 8.0, 6.2],
    [9.1, 5.5, 7.0],
    [6.8, 7.7, 8.9],
    [5.0, 9.5, 6.6],
])

print("ndim  :", notas.ndim)    # número de dimensiones
print("shape :", notas.shape)   # tamaño de cada dimensión
print("size  :", notas.size)    # número total de elementos
print("dtype :", notas.dtype)   # tipo de los elementos
```

- **`shape`** es el más importante. Es una tupla con el tamaño de cada eje: `(4, 3)` significa 4 filas y 3 columnas. Cuando algo falla en NumPy, mirar el `shape` es casi siempre el primer paso.
- **`ndim`** es la longitud de esa tupla.
- **`size`** es el producto de los números del `shape` (4 × 3 = 12).

Un array 1D tiene un `shape` de un solo elemento. Ojo con la coma: `(5,)` es una tupla de un elemento.

```python
np.arange(5).shape
```

## `dtype`: el tipo de los elementos

Todos los elementos de un array son del mismo tipo. NumPy lo deduce a partir de los datos:

```python
print(np.array([1, 2, 3]).dtype)
print(np.array([1.0, 2, 3]).dtype)
print(np.array([True, False]).dtype)
print(np.array(["hola", "mundo"]).dtype)
```

Si mezclas tipos, NumPy elige uno que los pueda representar a todos. Un solo decimal convierte todo el array a `float`:

```python
np.array([1, 2, 3.5])
```

Los tipos numéricos más comunes son:

| dtype | Qué guarda | Bytes por elemento |
|---|---|---|
| `bool` | `True` / `False` | 1 |
| `int8`, `int16`, `int32`, `int64` | enteros con signo | 1, 2, 4, 8 |
| `uint8` | enteros de 0 a 255 (píxeles de imágenes) | 1 |
| `float32`, `float64` | decimales | 4, 8 |
| `complex128` | números complejos | 16 |

El número del nombre indica los **bits**. `int64` usa 64 bits = 8 bytes.

### Elegir el tipo al crear

```python
a = np.array([1, 2, 3], dtype=np.float32)
print(a, a.dtype, a.itemsize, "bytes por elemento")
```

### Convertir con `astype`

`astype` devuelve una **copia** con otro tipo. Al pasar de decimal a entero, NumPy **trunca** (corta los decimales), no redondea:

```python
precios = np.array([1.99, 2.50, 3.75, -1.7])
print(precios.astype(int))
print(np.round(precios).astype(int))
```

## Memoria: `itemsize` y `nbytes`

```python
grande = np.zeros(1_000_000)
print(grande.dtype, "→", grande.nbytes / 1e6, "MB")

pequeno = np.zeros(1_000_000, dtype=np.float32)
print(pequeno.dtype, "→", pequeno.nbytes / 1e6, "MB")
```

Elegir bien el tipo puede reducir la memoria a la mitad o a la octava parte. Con datos grandes (el **Volumen** de las 5 V del Big Data) esto marca la diferencia entre que los datos quepan en RAM o no. Lo veremos a fondo en la lección 12.

## Cuidado 1: el desbordamiento (*overflow*)

Un `uint8` solo guarda valores de 0 a 255. ¿Qué pasa si te pasas?

```python
pixeles = np.array([200, 250, 255], dtype=np.uint8)
pixeles + 10
```

Los valores "dan la vuelta" como un cuentakilómetros: 255 + 10 = 265 → 265 − 256 = 9. NumPy **no avisa**. Es un error clásico al trabajar con imágenes. Para evitarlo, convierte a un tipo más grande antes de operar:

```python
pixeles.astype(np.int16) + 10
```

Puedes consultar los límites de cada tipo:

```python
print(np.iinfo(np.uint8))
print(np.iinfo(np.int32).max)
```

## Cuidado 2: los decimales no son exactos

Los `float` se guardan en binario y muchos decimales no tienen representación exacta. Esto no es cosa de NumPy, pasa igual en Python normal:

```python
0.1 + 0.2 == 0.3
```

Por eso, para comparar decimales se usa una tolerancia:

```python
print(np.isclose(0.1 + 0.2, 0.3))
print(np.allclose(np.array([0.1, 0.2]) * 3, [0.3, 0.6]))
```

## Una curiosidad: los escalares de NumPy

Cuando sacas un solo elemento de un array no obtienes un `int` o `float` de Python, sino un **escalar de NumPy**. Desde NumPy 2 se muestran así:

```python
x = np.array([1.5, 2.5])[0]
x
```

Se comportan como números normales. Si alguna vez necesitas el tipo de Python puro, usa `.item()`:

```python
x.item()
```

## Ejercicios

**1.** Crea un array de ceros con forma `(3, 4, 5)`. Sin ejecutar nada, ¿cuánto valen `ndim` y `size`? Compruébalo.

```python solucion
a = np.zeros((3, 4, 5))
print(a.ndim, a.size)   # 3 y 60
```

**2.** ¿Cuántos megabytes ocupa una imagen en color de 1920×1080 píxeles guardada como `uint8` (forma `(1080, 1920, 3)`)? ¿Y como `float64`?

```python solucion
img8 = np.zeros((1080, 1920, 3), dtype=np.uint8)
img64 = np.zeros((1080, 1920, 3), dtype=np.float64)
print(img8.nbytes / 1e6, "MB")
print(img64.nbytes / 1e6, "MB")
```

**3.** Convierte las temperaturas `[21.7, 19.2, 25.5, 18.9]` a enteros **redondeando**, no truncando.

```python solucion
temps = np.array([21.7, 19.2, 25.5, 18.9])
np.round(temps).astype(int)
```

**4.** Tienes `edades = np.array([120, 100, 90], dtype=np.int8)`. ¿Qué da `edades * 2`? ¿Por qué? Arréglalo.

```python solucion
edades = np.array([120, 100, 90], dtype=np.int8)
print(edades * 2)                   # int8 solo llega a 127: hay desbordamiento
print(edades.astype(np.int16) * 2)  # con un tipo más grande funciona
```
