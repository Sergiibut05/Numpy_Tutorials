---
titulo: Crear arrays
resumen: Todas las formas habituales de fabricar arrays, desde listas, rangos, rellenos constantes o valores aleatorios, en una, dos o más dimensiones.
bloque: Primeros pasos
duracion: 25 min
objetivos: Crear arrays de 1, 2 y 3 dimensiones | Usar zeros, ones, full, arange y linspace | Saber cuándo usar arange y cuándo linspace
---
```python
import numpy as np
```

## Desde una lista

La forma más directa es pasarle una lista a `np.array`:

```python
a = np.array([3, 1, 4, 1, 5])
a
```

Si le pasas **una lista de listas**, obtienes un array de **dos dimensiones** (una tabla o matriz). Cada lista interior es una **fila**:

```python
tabla = np.array([
    [1, 2, 3],
    [4, 5, 6],
])
tabla
```

Todas las filas deben tener la misma longitud. Un array es siempre "rectangular": no puede tener filas de tamaños distintos.

```python error
np.array([[1, 2, 3], [4, 5]])
```

Y con una lista de tablas tienes **tres dimensiones**. Piensa en un cubo, o en varias hojas de cálculo apiladas:

```python
cubo = np.array([
    [[1, 2], [3, 4]],
    [[5, 6], [7, 8]],
])
cubo
```

### Vocabulario: dimensiones y ejes

| Dimensiones | Nombre habitual | Ejemplo |
|---|---|---|
| 1 | vector | las notas de un alumno |
| 2 | matriz | una hoja de cálculo, una imagen en blanco y negro |
| 3 | tensor | una imagen en color (alto × ancho × 3 colores) |

Cada dimensión se llama **eje** (*axis*). En una tabla, el **eje 0** recorre las filas (hacia abajo) y el **eje 1** recorre las columnas (hacia la derecha). Lo usaremos muchísimo.

## Arrays rellenos de un valor

Muchas veces necesitas un array de un tamaño concreto antes de tener los datos. NumPy tiene funciones para eso. El tamaño se indica con un número (1D) o con una tupla `(filas, columnas)`.

```python
np.zeros(5)
```

```python
np.ones((2, 3))
```

```python
np.full((2, 4), 7)
```

Fíjate en que `zeros` y `ones` devuelven números con decimales (`0.`, `1.`). Por defecto NumPy usa números de coma flotante. Veremos los tipos en la siguiente lección.

También existen versiones `_like`, que copian la forma de otro array:

```python
np.zeros_like(tabla)
```

Y `np.eye(n)` crea la **matriz identidad**: unos en la diagonal y ceros fuera. Aparecerá en álgebra lineal.

```python
np.eye(3)
```

## Rangos de números

### `np.arange`: como `range`, pero devuelve un array

```python
np.arange(10)
```

```python
np.arange(2, 20, 3)   # inicio, fin (no incluido), paso
```

A diferencia de `range`, admite pasos decimales:

```python
np.arange(0, 1, 0.25)
```

### `np.linspace`: un número exacto de puntos

`linspace(inicio, fin, n)` reparte `n` puntos equiespaciados entre inicio y fin, **ambos incluidos**:

```python
np.linspace(0, 1, 5)
```

**¿Cuál uso?** Si sabes el **paso** que quieres, `arange`. Si sabes **cuántos puntos** quieres (por ejemplo, para dibujar una curva suave), `linspace`. Con pasos decimales, `linspace` es más seguro: por errores de redondeo, `arange` a veces incluye o excluye el último valor de forma inesperada.

```python
x = np.linspace(0, 2 * np.pi, 9)
np.round(np.sin(x), 3)
```

## Números aleatorios

Para generar datos de prueba se usa un **generador** de números aleatorios. La lección 9 trata este tema en detalle; por ahora basta con esto:

```python
rng = np.random.default_rng(seed=42)   # la semilla hace que siempre salgan los mismos

rng.integers(1, 7, size=10)            # diez tiradas de un dado
```

```python
rng.random((2, 3))                     # decimales entre 0 y 1
```

## Construir un array a partir de una fórmula

`np.fromfunction` llama a una función con los índices de cada posición. Por ejemplo, una tabla de multiplicar:

```python
np.fromfunction(lambda fila, col: (fila + 1) * (col + 1), (5, 5), dtype=int)
```

## Resumen

| Quiero... | Uso |
|---|---|
| convertir datos que ya tengo | `np.array(lista)` |
| un array vacío de ceros / unos / un valor | `np.zeros`, `np.ones`, `np.full` |
| la misma forma que otro array | `np.zeros_like`, `np.ones_like` |
| una secuencia con un paso | `np.arange(inicio, fin, paso)` |
| n puntos entre dos valores | `np.linspace(inicio, fin, n)` |
| la matriz identidad | `np.eye(n)` |
| datos aleatorios | `np.random.default_rng()` |

## Ejercicios

**1.** Crea un array con los números pares del 0 al 20, ambos incluidos.

```python solucion
np.arange(0, 21, 2)
```

**2.** Crea una matriz de 3 filas y 4 columnas llena de `-1`.

```python solucion
np.full((3, 4), -1)
```

**3.** Genera 11 puntos entre -5 y 5 (ambos incluidos). ¿Qué paso hay entre ellos?

```python solucion
puntos = np.linspace(-5, 5, 11)
print(puntos)
print("Paso:", puntos[1] - puntos[0])
```

**4.** Crea un tablero de 8×8 donde cada casilla valga `fila + columna`. Pista: `np.fromfunction`.

```python solucion
np.fromfunction(lambda f, c: f + c, (8, 8), dtype=int)
```
