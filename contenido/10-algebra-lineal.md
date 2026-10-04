---
titulo: Álgebra lineal
resumen: Vectores, producto escalar, producto de matrices, resolución de sistemas de ecuaciones y regresión lineal con np.linalg, explicado sin dar por hecho que recuerdas las matemáticas.
bloque: Herramientas
duracion: 40 min
objetivos: Distinguir * de @ | Resolver sistemas de ecuaciones con np.linalg.solve | Ajustar una recta a datos con mínimos cuadrados
---
```python
import numpy as np
import matplotlib.pyplot as plt
```

El álgebra lineal es el idioma de la ciencia de datos y del *machine learning*: una tabla de datos es una matriz, una red neuronal es una cadena de productos de matrices y una regresión es un sistema de ecuaciones. Aquí veremos lo esencial, sin demostraciones.

## Vectores

Un vector es un array 1D. Puedes pensarlo como una flecha o como una lista de características (por ejemplo, `[edad, altura, peso]`).

### Longitud (norma)

La norma es la longitud de la flecha: $\sqrt{x_1^2 + x_2^2 + \dots}$

```python
v = np.array([3, 4])
np.linalg.norm(v)
```

### Producto escalar (*dot product*)

Multiplica elemento a elemento y suma: $a \cdot b = a_1 b_1 + a_2 b_2 + \dots$

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(np.dot(a, b))
print(a @ b)              # el operador @ hace lo mismo
print((a * b).sum())      # y esto es lo que hace por dentro
```

Un uso muy práctico: calcular un total con precios y cantidades.

```python
precios = np.array([1.20, 0.85, 3.50])
cantidades = np.array([3, 6, 2])
precios @ cantidades
```

El producto escalar también mide **cuánto se parecen dos vectores**. La *similitud del coseno* lo normaliza entre -1 y 1. Es lo que usan los buscadores y los sistemas de recomendación para comparar textos o usuarios:

```python
def similitud_coseno(u, v):
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))

# cuánto le gustan a cada usuario [acción, comedia, drama, terror]
ana = np.array([5, 1, 2, 5])
luis = np.array([4, 0, 1, 5])
eva = np.array([0, 5, 4, 0])

print("Ana-Luis:", round(similitud_coseno(ana, luis), 3))
print("Ana-Eva: ", round(similitud_coseno(ana, eva), 3))
```

## Matrices

### `*` frente a `@`

Este es el punto que más confunde al empezar:

- `A * B` multiplica **elemento a elemento** (necesita formas iguales o compatibles por broadcasting).
- `A @ B` es el **producto de matrices**.

```python
A = np.array([[1, 2],
              [3, 4]])
B = np.array([[10, 20],
              [30, 40]])

print("A * B =\n", A * B)
print("A @ B =\n", A @ B)
```

### Cómo funciona el producto de matrices

Cada elemento del resultado `(i, j)` es el **producto escalar de la fila i de A con la columna j de B**:

```python
print("Fila 0 de A · columna 1 de B =", A[0] @ B[:, 1])
print("Elemento (0, 1) de A @ B     =", (A @ B)[0, 1])
```

La regla de las formas: `(m, n) @ (n, p) → (m, p)`. Las dimensiones "de dentro" tienen que coincidir.

```python
X = np.ones((5, 3))
W = np.ones((3, 2))
print((X @ W).shape)
```

```python error
np.ones((5, 3)) @ np.ones((2, 3))
```

> **Así funciona una capa de una red neuronal:** `salida = entradas @ pesos + sesgo`. Con 1000 ejemplos de 784 píxeles y una capa de 128 neuronas: `(1000, 784) @ (784, 128) → (1000, 128)`. El [tutorial oficial de deep learning con MNIST](https://numpy.org/numpy-tutorials/tutorial-deep-learning-on-mnist/) construye una red entera solo con NumPy.

El producto de matrices **no es conmutativo**: en general `A @ B` ≠ `B @ A`.

```python
print(np.array_equal(A @ B, B @ A))
```

### Identidad e inversa

La matriz identidad `I` es el "1" de las matrices: `A @ I = A`. La **inversa** de A es la matriz que cumple `A @ inv(A) = I`:

```python
A_inv = np.linalg.inv(A)
print(A_inv)
print(np.round(A @ A_inv, 10))
```

No todas las matrices tienen inversa. Si el **determinante** es 0, la matriz es *singular* y no se puede invertir:

```python
print(np.linalg.det(A))
S = np.array([[1, 2], [2, 4]])   # la segunda fila es el doble de la primera
print(np.linalg.det(S))
```

(El `-2.0000000000000004` en lugar de `-2` es el error de redondeo de los decimales que vimos en la lección 3.)

## Resolver sistemas de ecuaciones

Un caso real: en una tienda, 2 cafés y 1 croissant cuestan 5,10 €, y 1 café y 3 croissants cuestan 7,30 €. ¿Cuánto vale cada cosa?

$$2c + 1k = 5.10$$
$$1c + 3k = 7.30$$

En forma matricial es `A @ x = b`:

```python
A = np.array([[2, 1],
              [1, 3]])
b = np.array([5.10, 7.30])

x = np.linalg.solve(A, b)
print(f"café = {x[0]:.2f} €, croissant = {x[1]:.2f} €")
print("Comprobación:", A @ x)
```

> Usa `np.linalg.solve(A, b)` en vez de `np.linalg.inv(A) @ b`. Da el mismo resultado, pero es más rápido y numéricamente más preciso.

## Regresión lineal: ajustar una recta

Tenemos datos de metros cuadrados y precio de pisos, con ruido. Queremos la recta `precio = m · metros + c` que mejor se ajuste. Hay más ecuaciones (puntos) que incógnitas, así que no existe una solución exacta: buscamos la de **mínimos cuadrados**, la que minimiza la suma de los errores al cuadrado.

```python
rng = np.random.default_rng(5)
metros = rng.uniform(40, 150, 60)
precio = 2500 * metros + 30_000 + rng.normal(0, 25_000, 60)   # la "verdad" es m=2500, c=30000
```

Construimos la matriz `X` con una columna de metros y una columna de unos (para el término independiente `c`):

```python
X = np.column_stack([metros, np.ones_like(metros)])
print(X.shape)

(m, c), *_ = np.linalg.lstsq(X, precio)
print(f"precio ≈ {m:.0f} €/m² · metros + {c:.0f} €")
```

```python
x_linea = np.linspace(40, 150, 2)
plt.figure(figsize=(6, 3.5))
plt.scatter(metros, precio / 1000, s=15, color="#4D77CF", label="pisos")
plt.plot(x_linea, (m * x_linea + c) / 1000, color="#1B2A4A", label="ajuste")
plt.xlabel("metros cuadrados")
plt.ylabel("precio (miles de €)")
plt.legend()
plt.show()
```

Para ajustar polinomios hay un atajo: `np.polyfit(x, y, grado)`.

```python
np.polyfit(metros, precio, 1)
```

## Para saber más

`np.linalg` tiene mucho más: valores y vectores propios (`eig`), descomposición en valores singulares (`svd`), rangos, normas de matrices... El [tutorial oficial de álgebra lineal](https://numpy.org/numpy-tutorials/tutorial-svd/) usa la SVD para **comprimir una imagen**: es una lectura excelente después de esta lección.

```python
valores, vectores = np.linalg.eigh(np.array([[2.0, 1.0], [1.0, 2.0]]))
valores
```

## Ejercicios

**1.** Calcula la distancia entre los puntos `(1, 2, 3)` y `(4, 6, 3)`. Pista: la distancia es la norma de la diferencia.

```python solucion
p = np.array([1, 2, 3])
q = np.array([4, 6, 3])
np.linalg.norm(p - q)
```

**2.** Sin ejecutar, ¿qué forma tiene `np.ones((4, 2)) @ np.ones((2, 7))`? ¿Y `np.ones((7, 2)).T @ np.ones((7, 3))`?

```python solucion
print((np.ones((4, 2)) @ np.ones((2, 7))).shape)     # (4, 7)
print((np.ones((7, 2)).T @ np.ones((7, 3))).shape)   # (2, 7) @ (7, 3) → (2, 3)
```

**3.** Resuelve el sistema:

$$x + y + z = 6$$
$$2y + 5z = -4$$
$$2x + 5y - z = 27$$

```python solucion
A = np.array([[1, 1, 1],
              [0, 2, 5],
              [2, 5, -1]])
b = np.array([6, -4, 27])
np.linalg.solve(A, b)
```

**4.** Tres productos tienen estos precios: `[2.5, 4.0, 1.75]`. Tienes los pedidos de 4 clientes (filas) con las unidades de cada producto (columnas). Calcula lo que paga cada cliente con un solo producto de matrices.

```python
pedidos = np.array([
    [2, 0, 4],
    [1, 1, 1],
    [0, 3, 2],
    [5, 2, 0],
])
```

```python solucion
pedidos @ np.array([2.5, 4.0, 1.75])
```
