---
titulo: Operaciones vectorizadas
resumen: Aritmética, comparaciones y funciones matemáticas que se aplican a arrays enteros de golpe, y cómo convertir un bucle de Python en una expresión de NumPy.
bloque: Trabajar con arrays
duracion: 30 min
objetivos: Operar arrays entre sí y con números | Usar funciones universales (ufuncs) como sqrt, exp o log | Reescribir bucles como expresiones vectorizadas
---
```python
import numpy as np
```

## Aritmética elemento a elemento

Entre dos arrays de la misma forma, los operadores actúan **posición a posición**:

```python
a = np.array([1, 2, 3, 4])
b = np.array([10, 20, 30, 40])

print("a + b  =", a + b)
print("b - a  =", b - a)
print("a * b  =", a * b)
print("b / a  =", b / a)
print("b // 3 =", b // 3)   # división entera
print("b % 3  =", b % 3)    # resto
print("a ** 2 =", a ** 2)   # potencia
```

> `a * b` **no** es el producto de matrices. Es la multiplicación de cada elemento por su pareja. El producto matricial usa `@` y lo veremos en la lección 10.

Con un número (un **escalar**), la operación se aplica a todos los elementos:

```python
a * 100
```

Si las formas no encajan, NumPy da error:

```python error
np.array([1, 2, 3]) + np.array([1, 2])
```

(En la próxima lección veremos el **broadcasting**: las reglas que deciden cuándo formas distintas sí son compatibles.)

## Comparaciones

Las comparaciones también son elemento a elemento y devuelven booleanos:

```python
print(a > 2)
print(a == b / 10)
```

Para preguntar por el array entero:

```python
print("¿Alguno mayor que 3?", np.any(a > 3))
print("¿Todos positivos?   ", np.all(a > 0))
print("¿Arrays iguales?    ", np.array_equal(a, [1, 2, 3, 4]))
```

## Funciones universales (*ufuncs*)

NumPy trae versiones vectorizadas de todas las funciones matemáticas habituales. Se llaman **ufuncs** y funcionan sobre arrays de cualquier forma:

```python
x = np.array([1, 4, 9, 16, 25])

print("sqrt:", np.sqrt(x))
print("log: ", np.round(np.log(x), 3))
print("exp: ", np.round(np.exp([0, 1, 2]), 3))
print("abs: ", np.abs([-3, 2, -1]))
```

Trigonometría (en radianes):

```python
angulos = np.array([0, 30, 45, 60, 90])
radianes = np.deg2rad(angulos)
np.round(np.sin(radianes), 4)
```

Redondeo:

```python
v = np.array([-1.7, -0.5, 0.5, 1.2, 2.5])
print("round:", np.round(v))   # al par más cercano en los empates
print("floor:", np.floor(v))   # hacia abajo
print("ceil: ", np.ceil(v))    # hacia arriba
print("trunc:", np.trunc(v))   # quita decimales
```

Máximo y mínimo **elemento a elemento** entre dos arrays (no confundir con `max`, que busca el mayor de todo el array):

```python
np.maximum([1, 5, 3], [4, 2, 6])
```

`np.clip` recorta los valores a un intervalo. Muy útil para limpiar datos:

```python
np.clip([-5, 0, 3, 8, 12], 0, 10)
```

## Divisiones raras: `inf` y `nan`

NumPy no lanza un error al dividir entre cero, sino que avisa y devuelve valores especiales:

```python
np.array([1.0, -1.0, 0.0]) / 0
```

- `inf` es infinito.
- `nan` significa *Not a Number*: un resultado sin sentido, como 0/0. También se usa para representar **datos que faltan**.

`nan` tiene una propiedad curiosa: no es igual a nada, ni siquiera a sí mismo. Por eso para detectarlo se usa `np.isnan`:

```python
valores = np.array([1.0, np.nan, 3.0])
print(valores == np.nan)
print(np.isnan(valores))
```

## De bucle a vectorización: un ejemplo completo

Calculemos el **índice de masa corporal** (peso / altura²) de muchas personas.

Con un bucle, como lo harías en Python normal:

```python
rng = np.random.default_rng(0)
pesos = rng.normal(70, 12, size=100_000)       # kg
alturas = rng.normal(1.70, 0.09, size=100_000)  # m

def imc_bucle(pesos, alturas):
    resultado = []
    for p, h in zip(pesos, alturas):
        resultado.append(p / h ** 2)
    return np.array(resultado)
```

La versión vectorizada es una sola línea, y se lee igual que la fórmula:

```python
def imc_numpy(pesos, alturas):
    return pesos / alturas ** 2
```

Comprobamos que dan lo mismo y medimos:

```python
import time

inicio = time.perf_counter()
r1 = imc_bucle(pesos, alturas)
t1 = time.perf_counter() - inicio

inicio = time.perf_counter()
r2 = imc_numpy(pesos, alturas)
t2 = time.perf_counter() - inicio

print("¿Mismo resultado?", np.allclose(r1, r2))
print(f"Bucle: {t1*1000:.1f} ms | NumPy: {t2*1000:.2f} ms | {t1/t2:.0f}x más rápido")
```

La receta para vectorizar es siempre parecida:

1. Identifica la operación que se hace **en cada vuelta** del bucle.
2. Escríbela usando los arrays completos en lugar de los elementos.
3. Si hay un `if` dentro del bucle, sustitúyelo por una **máscara** o por `np.where`.

Por ejemplo, clasificar el IMC sin bucle:

```python
imc = imc_numpy(pesos, alturas)[:8]
np.where(imc < 18.5, "bajo", np.where(imc < 25, "normal", "alto"))
```

## Operaciones "in place"

`a += 1` modifica el array sin crear uno nuevo, lo que ahorra memoria con arrays grandes:

```python
contador = np.zeros(5)
contador += 1
contador *= 3
contador
```

## Ejercicios

**1.** Dados los lados de varios triángulos rectángulos, calcula la hipotenusa de cada uno sin usar bucles.

```python
cateto_a = np.array([3, 5, 8, 7])
cateto_b = np.array([4, 12, 15, 24])
```

```python solucion
np.sqrt(cateto_a ** 2 + cateto_b ** 2)
```

**2.** Convierte esta función con bucle en una versión vectorizada y comprueba que dan lo mismo.

```python
def descuento_bucle(precios):
    resultado = []
    for p in precios:
        if p > 50:
            resultado.append(p * 0.8)
        else:
            resultado.append(p)
    return np.array(resultado)

precios = np.array([20, 75, 50, 120, 5])
descuento_bucle(precios)
```

```python solucion
def descuento_numpy(precios):
    return np.where(precios > 50, precios * 0.8, precios)

print(descuento_numpy(precios))
print(np.allclose(descuento_bucle(precios), descuento_numpy(precios)))
```

**3.** Evalúa la función $f(x) = x^3 - 2x + 1$ en 5 puntos equiespaciados entre -2 y 2.

```python solucion
x = np.linspace(-2, 2, 5)
x ** 3 - 2 * x + 1
```

**4.** Unos sensores han devuelto lecturas con errores: valores negativos y por encima de 100 que no son posibles. Recórtalos al intervalo [0, 100] y cuenta cuántos estaban fuera.

```python
lecturas = np.array([12.5, -3.0, 45.2, 101.7, 99.9, 150.0, -0.1, 60.0])
```

```python solucion
fuera = (lecturas < 0) | (lecturas > 100)
print("Fuera de rango:", fuera.sum())
np.clip(lecturas, 0, 100)
```
