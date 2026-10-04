---
titulo: ¿Por qué NumPy?
resumen: Qué problema resuelve NumPy, por qué es mucho más rápido que las listas de Python y cómo empezar a usarlo.
bloque: Primeros pasos
duracion: 20 min
objetivos: Importar NumPy y crear tu primer array | Explicar la diferencia entre una lista y un array | Medir por qué la vectorización es más rápida
---
## El problema: muchos números

Imagina que tienes las temperaturas de un sensor tomadas cada segundo durante un año: más de 31 millones de valores. Quieres pasarlas de grados Celsius a Fahrenheit. Con lo que ya sabes de Python lo harías con una lista y un bucle:

```python
celsius = [21.5, 23.0, 19.8, 25.1, 22.4]

fahrenheit = []
for c in celsius:
    fahrenheit.append(c * 9 / 5 + 32)

fahrenheit
```

Funciona, pero tiene dos problemas cuando los datos crecen:

1. **Es lento.** Python interpreta el bucle línea a línea, y en cada vuelta comprueba de qué tipo es `c`, busca cómo se multiplica, crea un número nuevo...
2. **Ocupa mucha memoria.** Cada número de una lista es un objeto Python completo (unos 24 bytes más el puntero que lo referencia), aunque el dato en sí solo necesite 8 bytes.

**NumPy** (*Numerical Python*) es la librería que resuelve esto. Es la base de casi todo el ecosistema de datos en Python: pandas, scikit-learn, matplotlib, SciPy, PyTorch o TensorFlow están construidos sobre ella o hablan su idioma.

## Importar NumPy

Por convención, todo el mundo importa NumPy con el alias `np`. En Google Colab ya viene instalado; en tu ordenador se instala con `pip install numpy`.

```python
import numpy as np

np.__version__
```

## Tu primer array

La pieza central de NumPy es el **array** (su nombre técnico es `ndarray`, *n-dimensional array*). Se parece a una lista, pero todos sus elementos son del mismo tipo y están guardados uno detrás de otro en memoria.

```python
celsius = np.array([21.5, 23.0, 19.8, 25.1, 22.4])
celsius
```

Y ahora viene la magia: **las operaciones se aplican a todos los elementos a la vez**, sin escribir el bucle.

```python
fahrenheit = celsius * 9 / 5 + 32
fahrenheit
```

A esto se le llama **vectorización**: describes la operación sobre el conjunto entero y NumPy ejecuta el bucle por dentro, en código C compilado.

## Lista vs. array: no es lo mismo

Cuidado, porque los operadores no significan lo mismo en listas y en arrays:

```python
lista = [1, 2, 3]
array = np.array([1, 2, 3])

print("lista * 2 =", lista * 2)
print("array * 2 =", array * 2)
print("lista + lista =", lista + lista)
print("array + array =", array + array)
```

En una lista, `* 2` **repite** la lista y `+` las **concatena**. En un array, son operaciones **matemáticas elemento a elemento**.

## ¿Cuánto más rápido?

Vamos a medirlo con un millón de números. Usamos `time.perf_counter()`, que funciona como un cronómetro.

```python
import time

n = 1_000_000
lista = list(range(n))
array = np.arange(n)

inicio = time.perf_counter()
resultado_lista = [x * 2 for x in lista]
t_lista = time.perf_counter() - inicio

inicio = time.perf_counter()
resultado_array = array * 2
t_array = time.perf_counter() - inicio

print(f"Lista: {t_lista * 1000:.1f} ms")
print(f"Array: {t_array * 1000:.1f} ms")
print(f"NumPy es unas {t_lista / t_array:.0f} veces más rápido")
```

Tus números serán distintos según el ordenador, pero la diferencia suele estar entre 10 y 100 veces.

> **Conexión con Big O:** las dos versiones son O(n), porque tocan cada elemento una vez. NumPy no cambia la complejidad, cambia la **constante**: cada paso del bucle cuesta muchísimo menos. Cuando n es de millones, esa constante marca la diferencia entre esperar segundos o minutos.

## ¿Y la memoria?

Un array sabe exactamente cuántos bytes ocupan sus datos:

```python
import sys

numeros = list(range(1000))
array = np.arange(1000)

bytes_lista = sys.getsizeof(numeros) + sum(sys.getsizeof(x) for x in numeros)
print("Lista:", bytes_lista, "bytes")
print("Array:", array.nbytes, "bytes")
```

## Qué te llevas de esta lección

- NumPy se importa con `import numpy as np`.
- `np.array(lista)` convierte una lista en un array.
- Las operaciones sobre arrays se aplican elemento a elemento (**vectorización**), sin bucles.
- Los arrays son más rápidos y ocupan menos memoria porque todos sus elementos son del mismo tipo y están juntos en memoria.

## Ejercicios

**1.** Tienes los precios de cinco productos en euros. Crea un array con ellos y calcula el precio con un 21 % de IVA.

`precios = [10, 25.5, 3.99, 100, 47]`

```python solucion
precios = np.array([10, 25.5, 3.99, 100, 47])
con_iva = precios * 1.21
con_iva
```

**2.** Crea un array con las distancias `[5, 10, 21.1, 42.2]` en kilómetros y conviértelas a millas (1 km = 0.621371 millas).

```python solucion
km = np.array([5, 10, 21.1, 42.2])
millas = km * 0.621371
millas
```

**3.** Sin ejecutarlo, ¿qué crees que da `np.array([1, 2, 3]) + 10`? ¿Y `[1, 2, 3] + [10]`? Compruébalo.

```python solucion
print(np.array([1, 2, 3]) + 10)   # suma 10 a cada elemento
print([1, 2, 3] + [10])           # concatena las listas
```
