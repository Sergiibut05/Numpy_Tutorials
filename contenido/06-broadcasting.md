---
titulo: Broadcasting
resumen: Las reglas con las que NumPy combina arrays de formas distintas sin copiar datos, explicadas con dibujos de formas y casos reales como normalizar columnas.
bloque: Trabajar con arrays
duracion: 30 min
objetivos: Aplicar las dos reglas del broadcasting | Predecir la forma del resultado | Usar np.newaxis para hacer compatibles dos arrays
---
```python
import numpy as np
```

## La idea

Ya has hecho broadcasting sin saberlo: cuando escribes `array * 2`, NumPy "estira" el 2 para que tenga la forma del array, como si hubieras escrito `array * [2, 2, 2, ...]`.

```python
np.array([1, 2, 3]) * 2
```

El **broadcasting** generaliza esa idea a arrays de cualquier forma. Por ejemplo, una tabla de 3×3 más una fila de 3 elementos: la fila se suma a **cada fila** de la tabla.

```python
tabla = np.array([
    [0, 0, 0],
    [10, 10, 10],
    [20, 20, 20],
])
fila = np.array([1, 2, 3])

tabla + fila
```

En realidad NumPy no copia la fila tres veces en memoria: hace como si lo hiciera. Por eso el broadcasting es rápido y no gasta memoria extra.

## Las reglas

Para decidir si dos formas son compatibles, NumPy las **alinea por la derecha** y compara cada pareja de dimensiones:

1. Si a un array le faltan dimensiones, se le añaden unos **por la izquierda**.
2. Dos dimensiones son compatibles si **son iguales o si una de ellas vale 1**. La que vale 1 se estira hasta igualar a la otra.

Si alguna pareja no cumple la regla 2, hay error.

### Ejemplos

```text
tabla   (3, 3)          tabla   (3, 3)
fila       (3,)   →     fila    (1, 3)   regla 1
                        ---------------
resultado               (3, 3)   ✔ el 1 se estira a 3
```

```text
A       (4, 1)
B          (5,)  →  (1, 5)
---------------------------
resultado (4, 5)    ✔ los dos se estiran
```

```text
A       (3, 4)
B          (3,)  →  (1, 3)
---------------------------
                 4 frente a 3  ✘ error
```

Vamos a comprobarlos:

```python
A = np.arange(4).reshape(4, 1)
B = np.arange(5)
print(A.shape, "+", B.shape, "→", (A + B).shape)
A + B
```

```python error
np.ones((3, 4)) + np.arange(3)
```

## Columnas: `np.newaxis` y `reshape`

¿Y si quieres sumar algo a cada **columna** en vez de a cada fila? Un array 1D de forma `(3,)` se alinea por la derecha, así que se comporta como una fila. Para que se comporte como una columna, necesitas darle forma `(3, 1)`.

Hay dos formas equivalentes de hacerlo:

```python
v = np.array([100, 200, 300])

print(v[:, np.newaxis].shape)   # añade un eje nuevo de tamaño 1
print(v.reshape(-1, 1).shape)   # -1 significa "calcula tú este tamaño"
```

```python
tabla + v[:, np.newaxis]
```

## Caso práctico 1: tabla de multiplicar sin bucles

Una columna `(10, 1)` por una fila `(10,)` produce una tabla `(10, 10)`:

```python
n = np.arange(1, 11)
tabla_multiplicar = n[:, np.newaxis] * n
tabla_multiplicar
```

## Caso práctico 2: normalizar columnas

En ciencia de datos es muy habitual **estandarizar** cada columna: restarle su media y dividir por su desviación típica, para que todas las variables estén en la misma escala.

Tenemos una tabla de 5 personas con 3 variables (edad, altura en cm, salario en €). Cada variable tiene una escala completamente distinta:

```python
personas = np.array([
    [25, 170, 28000],
    [32, 182, 41000],
    [47, 165, 52000],
    [51, 175, 39000],
    [38, 160, 33000],
], dtype=float)

medias = personas.mean(axis=0)   # media de cada columna → forma (3,)
desv = personas.std(axis=0)

print("medias:", medias)
print("desv:  ", np.round(desv, 1))
```

`medias` tiene forma `(3,)` y `personas` tiene `(5, 3)`. Por broadcasting, la media de cada columna se resta a todas sus filas:

```python
estandarizado = (personas - medias) / desv
np.round(estandarizado, 2)
```

Ahora todas las columnas tienen media 0 y desviación 1:

```python
print(np.round(estandarizado.mean(axis=0), 10))
print(estandarizado.std(axis=0))
```

(El parámetro `axis` lo explicamos con detalle en la siguiente lección.)

## Caso práctico 3: distancias entre todos los puntos

Tenemos 4 puntos en el plano y queremos la distancia de cada uno a todos los demás. Con broadcasting se calcula la matriz completa de 4×4 de una vez:

```python
puntos = np.array([[0, 0], [3, 4], [6, 0], [3, -4]])

diferencias = puntos[:, np.newaxis, :] - puntos[np.newaxis, :, :]   # (4, 1, 2) - (1, 4, 2) → (4, 4, 2)
distancias = np.sqrt((diferencias ** 2).sum(axis=2))
distancias
```

Este patrón (añadir ejes para comparar "todos contra todos") aparece en algoritmos como k-vecinos más cercanos o k-means.

## Ejercicios

**1.** Sin ejecutar, predice la forma del resultado (o si hay error) de cada operación. Luego compruébalo.

- `(5, 3)` con `(3,)`
- `(5, 3)` con `(5,)`
- `(5, 1)` con `(1, 3)`
- `(2, 1, 4)` con `(3, 1)`

```python solucion
print((np.ones((5, 3)) + np.ones(3)).shape)          # (5, 3)
try:
    np.ones((5, 3)) + np.ones(5)
except ValueError as e:
    print("Error:", e)                                # 3 frente a 5
print((np.ones((5, 1)) + np.ones((1, 3))).shape)     # (5, 3)
print((np.ones((2, 1, 4)) + np.ones((3, 1))).shape)  # (2, 3, 4)
```

**2.** Tienes las ventas de 4 tiendas (filas) durante 3 meses (columnas) y el precio de cada mes. Calcula los ingresos multiplicando cada columna por su precio.

```python
unidades = np.array([
    [10, 12, 9],
    [5, 8, 7],
    [20, 18, 25],
    [3, 4, 2],
])
precio_mes = np.array([9.99, 10.49, 9.49])
```

```python solucion
unidades * precio_mes
```

**3.** Ahora cada **tienda** aplica un descuento distinto: `[0, 0.1, 0.05, 0.2]`. Aplica el descuento a los ingresos del ejercicio anterior (pista: el descuento va por filas).

```python solucion
descuentos = np.array([0, 0.1, 0.05, 0.2])
ingresos = unidades * precio_mes
np.round(ingresos * (1 - descuentos[:, np.newaxis]), 2)
```

**4.** Escala cada **fila** de esta matriz para que su valor máximo sea 1 (divide cada fila por su máximo).

```python
m = np.array([[1, 2, 4], [3, 9, 6], [5, 5, 10]])
```

```python solucion
maximos = m.max(axis=1, keepdims=True)   # keepdims mantiene la forma (3, 1)
m / maximos
```
