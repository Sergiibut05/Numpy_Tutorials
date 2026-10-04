---
titulo: Proyecto: fractales
resumen: Dibujar el conjunto de Mandelbrot y los conjuntos de Julia aplicando una fórmula a millones de números complejos a la vez. Es el cierre perfecto para juntar todo lo aprendido.
bloque: Proyectos
duracion: 40 min
objetivos: Trabajar con arrays de números complejos | Iterar sobre un array entero usando máscaras | Generar imágenes a partir de una fórmula
---
Este proyecto está inspirado en el tutorial oficial [Plotting Fractals](https://numpy.org/numpy-tutorials/tutorial-plotting-fractals/).

```python
import numpy as np
import matplotlib.pyplot as plt
```

## Números complejos en 30 segundos

Un número complejo tiene una parte real y una parte imaginaria: $z = a + bi$, donde $i^2 = -1$. Puedes pensarlo como un **punto del plano** $(a, b)$. Python y NumPy los entienden de serie: la $i$ se escribe `j`.

```python
z = 3 + 4j
print(z.real, z.imag, abs(z))   # abs es la distancia al origen
print(z ** 2)
```

Un array de complejos funciona como cualquier otro array:

```python
zs = np.array([1 + 1j, 2 - 1j, -1 + 0.5j])
print(zs ** 2)
print(np.abs(zs))
```

## Una rejilla de puntos del plano

Para dibujar, necesitamos un número complejo por cada píxel. Con `linspace` y broadcasting construimos la rejilla:

```python
def rejilla(x_min, x_max, y_min, y_max, ancho, alto):
    x = np.linspace(x_min, x_max, ancho)
    y = np.linspace(y_max, y_min, alto)          # de arriba a abajo, como en una imagen
    return x[np.newaxis, :] + 1j * y[:, np.newaxis]

plano = rejilla(-2, 2, -2, 2, 5, 5)
print(plano.shape)
plano
```

## El conjunto de Mandelbrot

Para cada punto $c$ del plano, empieza con $z = 0$ y repite:

$$z \leftarrow z^2 + c$$

Si $|z|$ se mantiene pequeño para siempre, $c$ pertenece al conjunto de Mandelbrot. Si en algún momento $|z| > 2$, se sabe que $z$ acabará escapando hacia el infinito. Lo interesante para colorear es **cuántas iteraciones tarda en escapar** cada punto.

La versión con bucles recorrería cada píxel uno a uno. La versión NumPy aplica la fórmula **a todos los píxeles a la vez** y usa una máscara para seguir solo los que aún no han escapado:

```python
def mandelbrot(c, max_iter=80):
    z = np.zeros_like(c)
    iteraciones = np.full(c.shape, max_iter)          # por defecto: no escapa
    activos = np.ones(c.shape, dtype=bool)            # puntos que siguen dentro

    for i in range(max_iter):
        z[activos] = z[activos] ** 2 + c[activos]
        escapan = activos & (np.abs(z) > 2)
        iteraciones[escapan] = i
        activos &= ~escapan
        if not activos.any():
            break
    return iteraciones

c = rejilla(-2.2, 0.8, -1.2, 1.2, 600, 480)
m = mandelbrot(c)
print(m.shape, m.min(), m.max())
```

```python
plt.figure(figsize=(7.5, 6))
plt.imshow(m, cmap="magma", extent=[-2.2, 0.8, -1.2, 1.2])
plt.xlabel("parte real")
plt.ylabel("parte imaginaria")
plt.title("Conjunto de Mandelbrot")
plt.show()
```

Son 288 000 puntos y 80 iteraciones, pero el bucle de Python solo da 80 vueltas: en cada una se procesan todos los puntos activos a la vez.

## Haciendo zoom

El borde del conjunto es infinitamente detallado: por mucho que te acerques, siempre aparecen formas nuevas. Basta con cambiar los límites de la rejilla (y subir las iteraciones, porque los detalles son más finos):

```python
zona = (-0.7485, -0.7435, 0.1, 0.104)
m_zoom = mandelbrot(rejilla(*zona, 600, 480), max_iter=300)

plt.figure(figsize=(7.5, 6))
plt.imshow(np.log1p(m_zoom), cmap="twilight_shifted", extent=zona)
plt.title("Zoom al 'valle de los caballitos de mar'")
plt.axis("off")
plt.show()
```

Usamos `np.log1p` (logaritmo de 1 + x) para que los colores se repartan mejor, porque la mayoría de puntos escapan en pocas iteraciones.

## Conjuntos de Julia

Los conjuntos de Julia usan la misma fórmula, pero al revés: $c$ es **fijo** y lo que cambia en cada píxel es el **punto de partida** $z$. Cada valor de $c$ da un fractal distinto.

```python
def julia(z, c, max_iter=100):
    z = z.copy()
    iteraciones = np.full(z.shape, max_iter)
    activos = np.ones(z.shape, dtype=bool)
    for i in range(max_iter):
        z[activos] = z[activos] ** 2 + c
        escapan = activos & (np.abs(z) > 2)
        iteraciones[escapan] = i
        activos &= ~escapan
    return iteraciones

z0 = rejilla(-1.6, 1.6, -1.0, 1.0, 400, 250)
valores_c = [-0.8 + 0.156j, 0.285 + 0.01j, -0.4 + 0.6j]

fig, ejes = plt.subplots(1, 3, figsize=(13, 3.4))
for eje, c_julia in zip(ejes, valores_c):
    eje.imshow(julia(z0, c_julia), cmap="viridis")
    eje.set_title(f"c = {c_julia}")
    eje.axis("off")
plt.tight_layout()
plt.show()
```

## Repaso: qué hemos usado

| Herramienta | Dónde |
|---|---|
| `linspace` + broadcasting (lecciones 2 y 6) | construir la rejilla de complejos |
| operaciones vectorizadas (lección 5) | `z ** 2 + c` sobre toda la imagen |
| máscaras booleanas (lección 4) | seguir solo los puntos activos |
| `np.full`, `zeros_like` (lección 2) | inicializar los resultados |
| agregaciones `any`, `min`, `max` (lección 7) | parar pronto y explorar el resultado |

## Retos

**1.** Calcula qué porcentaje de los puntos de la primera rejilla pertenece al conjunto de Mandelbrot (no escapó en las 80 iteraciones). Multiplicando por el área del rectángulo obtienes una estimación del área del conjunto (≈ 1.506).

```python solucion
dentro = (m == 80)
area_rectangulo = 3.0 * 2.4
print(f"{dentro.mean():.1%} de los puntos")
print(f"Área estimada: {dentro.mean() * area_rectangulo:.3f}")
```

**2.** El **Multibrot** usa $z \leftarrow z^d + c$ con otros exponentes. Modifica la función para aceptar un exponente `d` y dibuja el resultado para `d = 3`.

```python solucion
def multibrot(c, d=3, max_iter=60):
    z = np.zeros_like(c)
    iteraciones = np.full(c.shape, max_iter)
    activos = np.ones(c.shape, dtype=bool)
    for i in range(max_iter):
        z[activos] = z[activos] ** d + c[activos]
        escapan = activos & (np.abs(z) > 2)
        iteraciones[escapan] = i
        activos &= ~escapan
    return iteraciones

plt.figure(figsize=(5, 5))
plt.imshow(multibrot(rejilla(-1.5, 1.5, -1.5, 1.5, 400, 400)), cmap="inferno")
plt.axis("off")
plt.show()
```

**3.** El **Burning Ship** es una variante en la que antes de elevar al cuadrado se toma el valor absoluto de las partes real e imaginaria: `z = (|Re z| + i·|Im z|)² + c`. Dibújalo en la zona `(-2.2, 1.3, -2.0, 1.0)`. Pista: `np.abs(z.real) + 1j * np.abs(z.imag)`.

```python solucion
def burning_ship(c, max_iter=80):
    z = np.zeros_like(c)
    iteraciones = np.full(c.shape, max_iter)
    activos = np.ones(c.shape, dtype=bool)
    for i in range(max_iter):
        za = z[activos]
        z[activos] = (np.abs(za.real) + 1j * np.abs(za.imag)) ** 2 + c[activos]
        escapan = activos & (np.abs(z) > 2)
        iteraciones[escapan] = i
        activos &= ~escapan
    return iteraciones

zona = (-2.2, 1.3, -2.0, 1.0)
plt.figure(figsize=(6, 5))
plt.imshow(np.log1p(burning_ship(rejilla(*zona, 500, 430))), cmap="hot", extent=zona, origin="upper")
plt.axis("off")
plt.show()
```
