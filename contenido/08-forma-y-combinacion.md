---
titulo: Cambiar la forma y combinar arrays
resumen: Reorganizar los mismos datos en otra forma, transponer, aplanar, unir varios arrays en uno y partir uno en varios; también ordenar.
bloque: Trabajar con arrays
duracion: 30 min
objetivos: Usar reshape, ravel y transpose | Unir arrays con concatenate y stack | Ordenar con sort y argsort
---
```python
import numpy as np
```

## `reshape`: mismos datos, otra forma

`reshape` reorganiza los elementos en una forma nueva. La única condición es que **el número total de elementos no cambie**:

```python
a = np.arange(12)
print(a)
print(a.reshape(3, 4))
print(a.reshape(2, 2, 3))
```

Los elementos se van colocando **por filas**: primero se llena la fila 0, después la 1...

Uno de los tamaños puede ser `-1`, y NumPy lo calcula por ti:

```python
print(a.reshape(4, -1).shape)   # 12 / 4 = 3 columnas
print(a.reshape(-1, 6).shape)   # 12 / 6 = 2 filas
```

Si los tamaños no cuadran, error:

```python error
a.reshape(5, 3)
```

> `reshape` normalmente devuelve una **vista**: modificar el resultado modifica el original (ver lección 4).

## Aplanar: `ravel` y `flatten`

Hacen lo contrario: convierten cualquier array en 1D. `ravel` devuelve una vista si puede; `flatten` siempre una copia.

```python
m = np.arange(6).reshape(2, 3)
print(m.ravel())
print(m.flatten())
```

## Transponer: filas por columnas

`.T` intercambia filas y columnas:

```python
m = np.array([[1, 2, 3],
              [4, 5, 6]])
print(m.shape, "→", m.T.shape)
m.T
```

Con más dimensiones, `np.transpose` o `np.moveaxis` permiten reordenar los ejes como quieras. Por ejemplo, las imágenes a veces vienen como `(canales, alto, ancho)` y otras librerías las esperan como `(alto, ancho, canales)`:

```python
imagen = np.zeros((3, 480, 640))
print(np.moveaxis(imagen, 0, -1).shape)
```

## Añadir y quitar ejes de tamaño 1

```python
v = np.array([1, 2, 3])
print(np.expand_dims(v, axis=0).shape)   # igual que v[np.newaxis, :]
print(np.expand_dims(v, axis=1).shape)   # igual que v[:, np.newaxis]

w = np.zeros((1, 3, 1))
print(np.squeeze(w).shape)               # elimina todos los ejes de tamaño 1
```

## Unir arrays

### `concatenate`: pegar a lo largo de un eje existente

```python
a = np.array([[1, 2], [3, 4]])
b = np.array([[5, 6], [7, 8]])

print(np.concatenate([a, b], axis=0))   # una debajo de otra → (4, 2)
print(np.concatenate([a, b], axis=1))   # una al lado de otra → (2, 4)
```

Hay atajos con nombres más fáciles de recordar: `np.vstack` (vertical) y `np.hstack` (horizontal).

```python
print(np.vstack([a, b]).shape, np.hstack([a, b]).shape)
```

### `stack`: apilar creando un eje nuevo

`stack` necesita que todos los arrays tengan la misma forma y crea una dimensión nueva. Muy útil para juntar varias medidas:

```python
lunes = np.array([20, 22, 25])
martes = np.array([19, 23, 26])
miercoles = np.array([21, 24, 27])

semana = np.stack([lunes, martes, miercoles])
print(semana.shape)
semana
```

```python
np.stack([lunes, martes, miercoles], axis=1)   # cada día pasa a ser una columna
```

### Añadir filas o columnas a un array

`np.append` existe, pero **cada llamada crea un array nuevo copiando todo**. Dentro de un bucle es muy lento (O(n²) en total). Si vas a ir acumulando datos, guárdalos en una lista de Python y conviértela al final:

```python
filas = []
for i in range(4):
    filas.append([i, i ** 2, i ** 3])
np.array(filas)
```

## Partir arrays

```python
datos = np.arange(10)
print(np.split(datos, 2))            # en 2 partes iguales
print(np.split(datos, [3, 7]))       # cortando en las posiciones 3 y 7
```

Un uso clásico: separar datos de entrenamiento y de prueba.

```python
rng = np.random.default_rng(0)
muestras = rng.permutation(20)   # 20 índices mezclados
entreno, prueba = np.split(muestras, [16])
print("Entreno:", entreno)
print("Prueba: ", prueba)
```

## Ordenar

```python
puntos = np.array([42, 7, 19, 88, 3, 56])
print(np.sort(puntos))           # de menor a mayor
print(np.sort(puntos)[::-1])     # de mayor a menor
```

`np.sort` devuelve una copia; `puntos.sort()` ordena el array original.

`argsort` devuelve **los índices** que ordenarían el array. Sirve para ordenar un array según los valores de otro:

```python
jugadores = np.array(["Ana", "Luis", "Marta", "Iker", "Sara", "Pablo"])
orden = np.argsort(puntos)[::-1]
print(jugadores[orden])
print(puntos[orden])
```

En 2D se puede ordenar por filas o columnas, y ordenar las filas de una tabla según una columna:

```python
tabla = np.array([[3, 30], [1, 10], [2, 20]])
tabla[tabla[:, 0].argsort()]
```

## Ejercicios

**1.** Crea los números del 1 al 24 y conviértelos en una matriz de 4 filas. Después transponla. ¿Qué forma tiene?

```python solucion
m = np.arange(1, 25).reshape(4, -1)
print(m.T.shape)
m.T
```

**2.** Tienes las coordenadas `x` e `y` por separado. Júntalas en un array de forma `(5, 2)` donde cada fila sea un punto `(x, y)`.

```python
x = np.array([0, 1, 2, 3, 4])
y = np.array([0, 1, 4, 9, 16])
```

```python solucion
np.stack([x, y], axis=1)
```

**3.** Añade a la matriz `m = np.ones((3, 3))` una columna extra de ceros a la derecha.

```python solucion
m = np.ones((3, 3))
np.hstack([m, np.zeros((3, 1))])
```

**4.** Ordena estos productos de más caro a más barato y muestra el top 3.

```python
productos = np.array(["teclado", "ratón", "monitor", "cable", "portátil"])
precios = np.array([45.0, 19.9, 189.0, 5.5, 899.0])
```

```python solucion
orden = np.argsort(precios)[::-1]
for nombre, precio in zip(productos[orden][:3], precios[orden][:3]):
    print(f"{nombre}: {precio} €")
```
