---
titulo: Números aleatorios y simulación
resumen: Generar datos aleatorios reproducibles, muestrear de distribuciones habituales y usar simulaciones de Monte Carlo para responder preguntas difíciles de calcular a mano.
bloque: Herramientas
duracion: 30 min
objetivos: Crear un generador con semilla | Muestrear de distribuciones uniforme, normal y otras | Resolver problemas con simulaciones de Monte Carlo
---
```python
import numpy as np
import matplotlib.pyplot as plt
```

## El generador

La forma moderna de generar números aleatorios en NumPy es crear un **generador** con `np.random.default_rng()` y pedirle números a él:

```python
rng = np.random.default_rng()
rng.random(3)
```

Si vuelves a ejecutar esa celda, saldrán números distintos. Cuando quieres que un experimento sea **reproducible** (que tú y otra persona obtengáis exactamente lo mismo), le pasas una **semilla**:

```python
rng = np.random.default_rng(seed=2024)
print(rng.random(3))

rng = np.random.default_rng(seed=2024)
print(rng.random(3))   # los mismos números
```

> En tutoriales antiguos verás `np.random.seed(0)` y `np.random.rand(...)`. Es la API antigua: sigue funcionando, pero la recomendación oficial es usar `default_rng`.

## Lo más habitual

```python
rng = np.random.default_rng(7)

print("Enteros [1, 6]:  ", rng.integers(1, 7, size=8))
print("Decimales [0, 1):", np.round(rng.random(4), 3))
print("Uniforme [5, 10):", np.round(rng.uniform(5, 10, size=4), 3))
```

### Elegir y mezclar

```python
frutas = np.array(["manzana", "pera", "uva", "kiwi", "mango"])

print(rng.choice(frutas, size=3))                    # con repetición
print(rng.choice(frutas, size=3, replace=False))     # sin repetición
print(rng.choice(["cara", "cruz"], size=6, p=[0.7, 0.3]))   # moneda trucada
print(rng.permutation(frutas))                       # mezcladas
```

## Distribuciones

Una **distribución** describe qué valores son más probables. Las tres que más vas a ver:

```python
rng = np.random.default_rng(0)

uniforme = rng.uniform(0, 10, size=10_000)        # todos los valores igual de probables
normal = rng.normal(loc=5, scale=1.5, size=10_000)  # campana de Gauss: media 5, desviación 1.5
exponencial = rng.exponential(scale=2, size=10_000) # tiempos de espera

fig, ejes = plt.subplots(1, 3, figsize=(12, 3))
for eje, datos, titulo in zip(ejes, [uniforme, normal, exponencial],
                              ["Uniforme", "Normal", "Exponencial"]):
    eje.hist(datos, bins=50, color="#4D77CF")
    eje.set_title(titulo)
plt.tight_layout()
plt.show()
```

En una distribución normal, aproximadamente el 68 % de los valores cae a menos de una desviación típica de la media, y el 95 % a menos de dos. Podemos comprobarlo:

```python
dentro_1 = np.abs(normal - 5) < 1.5
dentro_2 = np.abs(normal - 5) < 3.0
print(f"A 1 desviación: {dentro_1.mean():.1%}")
print(f"A 2 desviaciones: {dentro_2.mean():.1%}")
```

Otras útiles: `rng.binomial` (número de éxitos en n intentos), `rng.poisson` (número de eventos en un intervalo, como visitas por minuto) y `rng.multivariate_normal`.

```python
visitas_por_minuto = rng.poisson(lam=4, size=10)
visitas_por_minuto
```

## Simulación de Monte Carlo

La idea de **Monte Carlo** es sencilla: si una probabilidad es difícil de calcular, simula el experimento muchísimas veces y cuenta. Con NumPy puedes simular millones de casos sin bucles.

### ¿Cuál es la probabilidad de sacar más de 10 sumando dos dados?

```python
rng = np.random.default_rng(1)
n = 1_000_000

dado1 = rng.integers(1, 7, size=n)
dado2 = rng.integers(1, 7, size=n)
suma = dado1 + dado2

print(f"Simulado: {(suma > 10).mean():.4f}")
print(f"Exacto:   {3 / 36:.4f}")   # (5,6), (6,5), (6,6)
```

### Estimar π lanzando dardos

Lanza puntos al azar en un cuadrado de lado 2 con un círculo de radio 1 dentro. La proporción de puntos que caen dentro del círculo es área del círculo / área del cuadrado $= \pi / 4$.

```python
rng = np.random.default_rng(3)
n = 5000
x = rng.uniform(-1, 1, n)
y = rng.uniform(-1, 1, n)
dentro = x ** 2 + y ** 2 <= 1

print("π ≈", 4 * dentro.mean())

plt.figure(figsize=(4, 4))
plt.scatter(x[dentro], y[dentro], s=1, color="#4D77CF")
plt.scatter(x[~dentro], y[~dentro], s=1, color="#C7CDD8")
plt.gca().set_aspect("equal")
plt.title(f"{n} dardos")
plt.show()
```

Con más puntos la estimación mejora, aunque despacio: el error baja como $1/\sqrt{n}$.

```python
for n in [100, 10_000, 1_000_000, 10_000_000]:
    p = rng.uniform(-1, 1, (n, 2))
    estimacion = 4 * ((p ** 2).sum(axis=1) <= 1).mean()
    print(f"n={n:>10,}  π≈{estimacion:.5f}  error={abs(estimacion - np.pi):.5f}")
```

### Un paseo aleatorio

Un "paseo aleatorio" es una secuencia de pasos +1 o −1 al azar. Sirve como modelo sencillo de precios en bolsa o de difusión de partículas. `cumsum` convierte los pasos en posiciones:

```python
rng = np.random.default_rng(10)
pasos = rng.choice([-1, 1], size=(5, 1000))   # 5 paseos de 1000 pasos
posiciones = pasos.cumsum(axis=1)

plt.figure(figsize=(8, 3))
plt.plot(posiciones.T, linewidth=1)
plt.xlabel("paso")
plt.ylabel("posición")
plt.show()
```

## Ejercicios

**1.** Simula 10 000 lanzamientos de una moneda justa y calcula la proporción de caras.

```python solucion
rng = np.random.default_rng(0)
lanzamientos = rng.choice(["cara", "cruz"], size=10_000)
(lanzamientos == "cara").mean()
```

**2.** Genera las alturas de 1000 personas con media 170 cm y desviación 8 cm. ¿Qué porcentaje mide más de 185 cm?

```python solucion
rng = np.random.default_rng(0)
alturas = rng.normal(170, 8, size=1000)
print(f"{(alturas > 185).mean():.1%}")
```

**3.** **El problema del cumpleaños.** En un grupo de 23 personas, ¿qué probabilidad hay de que al menos dos cumplan años el mismo día? Simúlalo con 100 000 grupos. Pista: genera una matriz `(100_000, 23)` de días entre 0 y 364, ordena cada fila y busca dos valores consecutivos iguales con `np.diff`.

```python solucion
rng = np.random.default_rng(0)
grupos = rng.integers(0, 365, size=(100_000, 23))
grupos.sort(axis=1)
hay_repetido = (np.diff(grupos, axis=1) == 0).any(axis=1)
hay_repetido.mean()   # ≈ 0.507, ¡más de la mitad!
```

**4.** En un paseo aleatorio de 1000 pasos, ¿cuál es la distancia máxima media al origen? Simula 2000 paseos.

```python solucion
rng = np.random.default_rng(0)
pasos = rng.choice([-1, 1], size=(2000, 1000))
posiciones = pasos.cumsum(axis=1)
np.abs(posiciones).max(axis=1).mean()
```
