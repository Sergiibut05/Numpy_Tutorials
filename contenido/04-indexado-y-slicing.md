---
titulo: Indexado y slicing
resumen: Cómo leer y modificar partes de un array, por posición, por rangos, con condiciones o con listas de índices, y la diferencia entre una vista y una copia.
bloque: Trabajar con arrays
duracion: 35 min
objetivos: Acceder a elementos, filas y columnas | Filtrar con máscaras booleanas | Distinguir vistas de copias para no modificar datos sin querer
---
```python
import numpy as np
```

## En una dimensión: igual que las listas

Los índices empiezan en 0 y los negativos cuentan desde el final:

```python
a = np.array([10, 20, 30, 40, 50, 60])
print(a[0], a[2], a[-1])
```

El **slicing** `inicio:fin:paso` funciona igual que en las listas. El `fin` no se incluye:

```python
print(a[1:4])    # posiciones 1, 2 y 3
print(a[:3])     # las tres primeras
print(a[3:])     # desde la 3 hasta el final
print(a[::2])    # de dos en dos
print(a[::-1])   # al revés
```

## En dos dimensiones: `[fila, columna]`

En un array 2D pones los índices separados por una coma, **dentro de los mismos corchetes**:

```python
m = np.arange(1, 21).reshape(4, 5)
m
```

```python
m[1, 3]      # fila 1, columna 3
```

Funciona también `m[1][3]`, pero es más lento y menos claro. Usa siempre `m[1, 3]`.

Los dos puntos `:` solos significan "todo ese eje":

```python
print("Fila 0:     ", m[0, :])
print("Columna 2:  ", m[:, 2])
print("Última fila:", m[-1])      # si omites los últimos índices, se toman enteros
```

Y puedes combinar slices en los dos ejes para recortar un bloque:

```python
m[1:3, 2:5]   # filas 1-2, columnas 2-4
```

```python
m[::2, ::2]   # una fila sí y otra no, una columna sí y otra no
```

## Modificar con índices

Todo lo que puedes leer lo puedes asignar. Si asignas un solo valor a un trozo, se copia en todas sus posiciones:

```python
m2 = m.copy()
m2[0, 0] = 100
m2[:, -1] = 0        # toda la última columna a cero
m2[2:, :2] = -1      # bloque inferior izquierdo
m2
```

## Máscaras booleanas: filtrar por condición

Esta es una de las herramientas más útiles de NumPy. Al comparar un array con un valor obtienes un array de `True`/`False` de la misma forma:

```python
temps = np.array([18.5, 22.1, 30.4, 15.2, 27.8, 33.0, 21.0])
temps > 25
```

Y ese array de booleanos se puede usar **como índice**: te quedas solo con los elementos donde hay `True`.

```python
temps[temps > 25]
```

Para combinar condiciones se usan `&` (y), `|` (o) y `~` (no). **Los paréntesis son obligatorios**, porque `&` y `|` tienen más prioridad que `>`:

```python
temps[(temps > 20) & (temps < 30)]
```

```python
temps[(temps < 16) | (temps > 32)]
```

> No uses `and` / `or` con arrays: Python intenta convertir el array entero a un solo `True` o `False` y da error.

```python error
temps[(temps > 20) and (temps < 30)]
```

Las máscaras también sirven para **modificar**. Por ejemplo, limitar los valores por encima de 30:

```python
corregidas = temps.copy()
corregidas[corregidas > 30] = 30
corregidas
```

Como `True` cuenta como 1, sumar una máscara te dice cuántos elementos cumplen la condición:

```python
print("Días de calor:", (temps > 25).sum())
print("Porcentaje:", (temps > 25).mean() * 100, "%")
```

### `np.where`: elegir entre dos valores

`np.where(condición, si_true, si_false)` construye un array nuevo eligiendo elemento a elemento:

```python
np.where(temps > 25, "calor", "normal")
```

Con un solo argumento, `np.where` te devuelve las **posiciones** donde se cumple la condición:

```python
np.where(temps > 25)
```

## Indexado con listas (*fancy indexing*)

También puedes pasar una lista de posiciones y obtener esos elementos en ese orden:

```python
letras = np.array(["a", "b", "c", "d", "e"])
letras[[4, 0, 2]]
```

En 2D puedes elegir filas concretas:

```python
m[[0, 3]]
```

Y si pasas **dos listas**, una para filas y otra para columnas, NumPy las empareja posición a posición: `(0, 1)` y `(3, 4)`.

```python
m[[0, 3], [1, 4]]
```

## Vistas y copias: la trampa más importante

Cuando haces **slicing**, NumPy **no copia** los datos: te da una **vista**, una ventana sobre el mismo bloque de memoria. Es lo que lo hace rápido, pero tiene una consecuencia:

```python
original = np.arange(6)
trozo = original[2:5]
trozo[0] = 999
print("trozo:   ", trozo)
print("original:", original)
```

¡Modificar el trozo ha cambiado el original! Si quieres un array independiente, usa `.copy()`:

```python
original = np.arange(6)
trozo = original[2:5].copy()
trozo[0] = 999
print("trozo:   ", trozo)
print("original:", original)
```

La regla práctica:

| Operación | ¿Vista o copia? |
|---|---|
| slicing `a[1:4]`, `a[:, 0]` | **vista** |
| máscara booleana `a[a > 0]` | copia |
| lista de índices `a[[0, 2]]` | copia |
| `.copy()` | copia |

Puedes comprobarlo con `np.shares_memory`:

```python
a = np.arange(10)
print(np.shares_memory(a, a[2:5]))
print(np.shares_memory(a, a[a > 5]))
```

## Ejercicios

Usa esta matriz para los ejercicios:

```python
datos = np.arange(1, 37).reshape(6, 6)
datos
```

**1.** Extrae la segunda columna completa y la penúltima fila completa.

```python solucion
print(datos[:, 1])
print(datos[-2])
```

**2.** Extrae el bloque central de 2×2 (los valores 15, 16, 21 y 22).

```python solucion
datos[2:4, 2:4]
```

**3.** Obtén todos los números múltiplos de 7 de la matriz.

```python solucion
datos[datos % 7 == 0]
```

**4.** Crea una copia de `datos` donde los números impares se sustituyan por 0. El original no debe cambiar.

```python solucion
pares = datos.copy()
pares[pares % 2 == 1] = 0
pares
```

**5.** Usa `np.where` para crear una matriz que valga `1` donde `datos` es mayor que 18 y `0` en el resto.

```python solucion
np.where(datos > 18, 1, 0)
```

**6.** Extrae las esquinas de la matriz (los cuatro valores 1, 6, 31 y 36) con una sola expresión.

```python solucion
datos[[0, 0, -1, -1], [0, -1, 0, -1]]
```
