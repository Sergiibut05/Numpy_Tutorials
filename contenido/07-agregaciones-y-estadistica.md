---
titulo: Agregaciones y estadística
resumen: Resumir miles de valores en unos pocos números (suma, media, desviación, máximos, percentiles), por filas o por columnas, y cómo tratar los datos que faltan.
bloque: Trabajar con arrays
duracion: 30 min
objetivos: Calcular estadísticas descriptivas | Entender el parámetro axis de una vez por todas | Manejar valores nan con nanmean y similares
---
```python
import numpy as np
```

## Agregar: de muchos valores a uno

Una **agregación** resume un array en un número. Todas existen como función (`np.sum(a)`) y como método (`a.sum()`):

```python
ventas = np.array([120, 340, 95, 410, 230, 180, 275])

print("Total:   ", ventas.sum())
print("Media:   ", ventas.mean())
print("Mediana: ", np.median(ventas))
print("Desv.:   ", round(ventas.std(), 2))
print("Mínimo:  ", ventas.min())
print("Máximo:  ", ventas.max())
```

Para saber **dónde** está el máximo o el mínimo, usa `argmax` / `argmin`, que devuelven la posición:

```python
dias = np.array(["lun", "mar", "mié", "jue", "vie", "sáb", "dom"])
print("Mejor día:", dias[ventas.argmax()])
print("Peor día: ", dias[ventas.argmin()])
```

Y las versiones **acumuladas**, que van guardando el resultado parcial:

```python
print("Acumulado:", np.cumsum(ventas))
print("Diferencia con el día anterior:", np.diff(ventas))
```

## El parámetro `axis`

Con arrays 2D puedes agregar todo el array, o solo **a lo largo de un eje**. Aquí está la clave para no liarse:

> `axis=0` **colapsa las filas**: el resultado tiene un valor por cada columna.
> `axis=1` **colapsa las columnas**: el resultado tiene un valor por cada fila.

Dicho de otra forma: el eje que indicas es el que **desaparece**.

```python
# 4 alumnos (filas) × 3 exámenes (columnas)
notas = np.array([
    [7.5, 8.0, 6.0],
    [9.0, 5.5, 7.0],
    [6.5, 7.5, 9.0],
    [5.0, 9.5, 6.5],
])

print("Forma:", notas.shape)
print("Media de todo:          ", notas.mean())
print("Media por examen (axis=0):", notas.mean(axis=0))
print("Media por alumno (axis=1):", notas.mean(axis=1))
```

```text
                examen 0  examen 1  examen 2
alumno 0           7.5       8.0       6.0     ─┐
alumno 1           9.0       5.5       7.0      │ axis=1 → una media
alumno 2           6.5       7.5       9.0      │ por fila
alumno 3           5.0       9.5       6.5     ─┘
                    │         │         │
                    └── axis=0 → una media por columna
```

La forma te lo confirma: `(4, 3)` con `axis=0` da `(3,)`; con `axis=1` da `(4,)`.

### `keepdims`: conservar el eje como tamaño 1

A veces quieres usar el resultado para operar con el array original (por ejemplo, restar la media de cada alumno). `keepdims=True` deja la dimensión con tamaño 1, lo que encaja perfecto con el broadcasting:

```python
media_alumno = notas.mean(axis=1, keepdims=True)
print(media_alumno.shape)
notas - media_alumno
```

## Más estadística

### Percentiles y cuantiles

El percentil 25 es el valor por debajo del cual queda el 25 % de los datos:

```python
rng = np.random.default_rng(1)
tiempos = rng.exponential(scale=30, size=1000)   # tiempos de espera en segundos

p25, p50, p75, p95 = np.percentile(tiempos, [25, 50, 75, 95])
print(f"P25={p25:.1f}s  mediana={p50:.1f}s  P75={p75:.1f}s  P95={p95:.1f}s")
```

> La **media** se ve muy afectada por valores extremos; la **mediana** no. En datos con colas largas (tiempos, salarios, precios), la mediana suele describir mejor el "caso típico".

```python
print("Media:  ", round(tiempos.mean(), 1))
print("Mediana:", round(np.median(tiempos), 1))
```

### Correlación

`np.corrcoef` mide si dos variables suben y bajan juntas (1 = totalmente, 0 = nada, -1 = al revés):

```python
horas_estudio = np.array([1, 2, 3, 4, 5, 6, 7, 8])
nota = np.array([4.0, 4.5, 5.5, 6.0, 6.8, 7.5, 8.1, 9.0])

np.corrcoef(horas_estudio, nota)
```

El resultado es una matriz 2×2: el valor que nos interesa está fuera de la diagonal.

### Histograma: contar por intervalos

```python
conteos, bordes = np.histogram(tiempos, bins=[0, 15, 30, 60, 120, 1000])
for i in range(len(conteos)):
    print(f"{bordes[i]:>4.0f}-{bordes[i+1]:<4.0f}s: {conteos[i]}")
```

### Valores únicos

```python
colores = np.array(["rojo", "azul", "rojo", "verde", "azul", "rojo"])
valores, cuantos = np.unique(colores, return_counts=True)
print(valores)
print(cuantos)
```

## Datos que faltan: `nan`

En datos reales siempre faltan valores. Se suelen representar con `np.nan`, y el problema es que **contaminan** cualquier cálculo:

```python
temperaturas = np.array([21.0, 22.5, np.nan, 23.1, np.nan, 20.8])
temperaturas.mean()
```

Cada agregación tiene una versión `nan...` que ignora los huecos:

```python
print("Media:   ", np.nanmean(temperaturas))
print("Máximo:  ", np.nanmax(temperaturas))
print("Faltan:  ", np.isnan(temperaturas).sum())
```

O puedes rellenarlos, por ejemplo con la media:

```python
rellenas = np.where(np.isnan(temperaturas), np.nanmean(temperaturas), temperaturas)
np.round(rellenas, 2)
```

> NumPy también tiene **arrays enmascarados** (`np.ma`), que marcan qué valores son válidos sin usar `nan`. Si te interesa, el [tutorial oficial de Masked Arrays](https://numpy.org/numpy-tutorials/tutorial-ma/) los explica con datos reales de la COVID-19.

## Ejercicios

Usa estos datos: temperaturas máximas de 4 ciudades (filas) durante 7 días (columnas).

```python
ciudades = np.array(["Madrid", "Sevilla", "Bilbao", "Valencia"])
temp = np.array([
    [31, 33, 35, 34, 30, 29, 32],
    [36, 38, 39, 41, 40, 37, 38],
    [22, 24, 21, 19, 23, 25, 24],
    [29, 30, 31, 30, 32, 31, 30],
])
```

**1.** Calcula la temperatura media de cada ciudad y di cuál es la más calurosa.

```python solucion
medias = temp.mean(axis=1)
print(dict(zip(ciudades, np.round(medias, 1))))
print("Más calurosa:", ciudades[medias.argmax()])
```

**2.** ¿Qué día (0 a 6) fue el más caluroso de media entre todas las ciudades?

```python solucion
temp.mean(axis=0).argmax()
```

**3.** Calcula la amplitud térmica (máximo − mínimo) de cada ciudad durante la semana. Pista: `np.ptp` o combinando `max` y `min`.

```python solucion
print(temp.max(axis=1) - temp.min(axis=1))
print(np.ptp(temp, axis=1))
```

**4.** ¿Cuántos días superó cada ciudad los 30 grados?

```python solucion
(temp > 30).sum(axis=1)
```

**5.** Resta a cada ciudad su propia media semanal, para ver qué días estuvieron por encima o por debajo de lo normal **en esa ciudad**.

```python solucion
np.round(temp - temp.mean(axis=1, keepdims=True), 1)
```
