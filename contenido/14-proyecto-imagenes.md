---
titulo: Proyecto: imágenes como arrays
resumen: Una imagen digital es un array de números. Vamos a crear una desde cero y a recortarla, girarla, pasarla a blanco y negro, ajustar el brillo, desenfocarla y detectar bordes solo con NumPy.
bloque: Proyectos
duracion: 45 min
objetivos: Entender una imagen como un array (alto, ancho, canales) | Aplicar slicing, broadcasting y máscaras a imágenes | Construir filtros de desenfoque y de bordes
---
Si quieres ver estas técnicas aplicadas a imágenes médicas reales, el tutorial oficial [X-ray image processing](https://numpy.org/numpy-tutorials/tutorial-x-ray-image-processing/) es el siguiente paso natural.

```python
import numpy as np
import matplotlib.pyplot as plt

def mostrar(*imagenes, titulos=None, tam=3.2):
    """Muestra varias imágenes una al lado de otra."""
    fig, ejes = plt.subplots(1, len(imagenes), figsize=(tam * len(imagenes), tam))
    ejes = np.atleast_1d(ejes)
    for i, (eje, img) in enumerate(zip(ejes, imagenes)):
        eje.imshow(img, cmap="gray" if img.ndim == 2 else None, vmin=0, vmax=255)
        eje.set_title(titulos[i] if titulos else "")
        eje.axis("off")
    plt.tight_layout()
    plt.show()
```

## Qué es una imagen

Una imagen en color es un array de forma **(alto, ancho, 3)**: para cada píxel hay tres números, la cantidad de **rojo, verde y azul** (RGB), cada uno entre 0 y 255 (`uint8`).

```python
diminuta = np.array([
    [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
    [[255, 255, 0], [255, 255, 255], [0, 0, 0]],
], dtype=np.uint8)

print(diminuta.shape)
mostrar(diminuta, titulos=["imagen de 2×3 píxeles"])
```

## Crear un paisaje desde cero

Vamos a "pintar" una imagen de 240×360 usando solo operaciones de arrays. Primero, unas cuadrículas con las coordenadas de cada píxel:

```python
alto, ancho = 240, 360
filas, cols = np.mgrid[0:alto, 0:ancho]   # filas[i, j] = i, cols[i, j] = j
print(filas.shape, cols.shape)
```

```python
img = np.zeros((alto, ancho, 3), dtype=np.float64)

# Cielo: degradado de azul (arriba) a naranja (abajo) con broadcasting
t = (filas / alto)[..., np.newaxis]                   # (240, 360, 1), de 0 a 1
azul, naranja = np.array([40, 90, 180]), np.array([250, 170, 90])
img[:] = (1 - t) * azul + t * naranja

# Sol: los píxeles a menos de 30 de un centro
sol = (filas - 150) ** 2 + (cols - 250) ** 2 < 30 ** 2
img[sol] = [255, 230, 120]

# Montañas: por debajo de una curva hecha con senos
perfil = 170 + 25 * np.sin(cols / 40) + 12 * np.sin(cols / 13)
img[filas > perfil] = [45, 60, 70]

# Un poco de ruido para que parezca una foto
rng = np.random.default_rng(0)
img += rng.normal(0, 6, img.shape)

paisaje = np.clip(img, 0, 255).astype(np.uint8)
mostrar(paisaje, titulos=["paisaje generado"], tam=4.5)
```

Cada elemento del dibujo es algo que ya conoces: el degradado es **broadcasting**, el sol y las montañas son **máscaras booleanas**, y el ruido es **aleatorio**.

## Canales de color

```python
rojo, verde, azul_c = paisaje[..., 0], paisaje[..., 1], paisaje[..., 2]
mostrar(rojo, verde, azul_c, titulos=["rojo", "verde", "azul"])
```

`...` (*Ellipsis*) significa "todos los ejes anteriores". `paisaje[..., 0]` es lo mismo que `paisaje[:, :, 0]`.

## Recortar, voltear y girar: slicing

```python
recorte = paisaje[100:200, 200:320]      # filas 100-199, columnas 200-319
espejo = paisaje[:, ::-1]                # columnas al revés
boca_abajo = paisaje[::-1]               # filas al revés
girada = np.rot90(paisaje)

mostrar(recorte, espejo, boca_abajo, girada, titulos=["recorte", "espejo", "boca abajo", "girada 90°"])
```

Todas son **vistas** (salvo `rot90`, que también lo es en la mayoría de casos): no copian ni un píxel.

Reducir la resolución es tan fácil como quedarse con uno de cada `n` píxeles:

```python
pequena = paisaje[::4, ::4]
print(paisaje.shape, "→", pequena.shape)
```

## Blanco y negro: un producto escalar

El ojo humano es más sensible al verde que al rojo o al azul. La fórmula estándar de luminancia es una media ponderada de los tres canales, que es justo un **producto escalar** por píxel:

```python
pesos = np.array([0.299, 0.587, 0.114])
gris = paisaje @ pesos                     # (240, 360, 3) @ (3,) → (240, 360)
print(gris.shape, gris.dtype)
gris = gris.astype(np.uint8)
mostrar(paisaje, gris, titulos=["color", "gris"])
```

## Brillo y contraste: cuidado con el desbordamiento

¿Subimos el brillo sumando 100? Con `uint8` los valores dan la vuelta (lección 3):

```python
mal = gris + 100                                          # ¡desbordamiento!
bien = np.clip(gris.astype(np.int16) + 100, 0, 255).astype(np.uint8)
mostrar(gris, mal, bien, titulos=["original", "+100 en uint8", "+100 con clip"])
```

El **contraste** se cambia alejando los valores de la media, y el **negativo** es simplemente `255 - imagen`:

```python
media = gris.mean()
contraste = np.clip((gris.astype(float) - media) * 1.8 + media, 0, 255).astype(np.uint8)
negativo = 255 - gris
mostrar(contraste, negativo, titulos=["más contraste", "negativo"])
```

## Histograma de una imagen

```python
plt.figure(figsize=(6, 2.5))
plt.hist(gris.ravel(), bins=64, color="#4D77CF")
plt.xlabel("nivel de gris")
plt.ylabel("píxeles")
plt.show()
```

Los picos corresponden a las zonas grandes de un mismo tono: las montañas (oscuro), el cielo (tonos medios) y el sol (claro).

## Umbral: segmentar con una máscara

Separar el sol del resto es tan fácil como una comparación:

```python
mascara_sol = gris > 200
print(f"El sol ocupa {mascara_sol.mean():.1%} de la imagen")

resaltado = paisaje.copy()
resaltado[~mascara_sol] = (resaltado[~mascara_sol] * 0.3).astype(np.uint8)
mostrar(mascara_sol.astype(np.uint8) * 255, resaltado, titulos=["máscara", "solo el sol"])
```

## Desenfoque: media de los vecinos

Un **desenfoque de caja** sustituye cada píxel por la media de un cuadrado de vecinos. En vez de un bucle por píxel, sumamos versiones **desplazadas** de la imagen con slicing:

```python
def desenfocar(img, radio=2):
    img = img.astype(np.float64)
    k = 2 * radio + 1
    relleno = np.pad(img, radio, mode="edge")     # repite los bordes para no perder tamaño
    suma = np.zeros_like(img)
    for dy in range(k):
        for dx in range(k):
            suma += relleno[dy:dy + img.shape[0], dx:dx + img.shape[1]]
    return (suma / k ** 2).astype(np.uint8)

mostrar(gris, desenfocar(gris, 2), desenfocar(gris, 6), titulos=["original", "radio 2", "radio 6"])
```

El bucle solo da `k²` vueltas (25 para radio 2), no una por píxel: cada vuelta procesa la imagen entera.

## Detección de bordes: diferencias

Un **borde** es un sitio donde el valor cambia bruscamente. `np.diff` calcula la diferencia entre píxeles vecinos, así que es un detector de bordes muy simple:

```python
suave = desenfocar(gris, 1).astype(np.float64)       # quitamos ruido primero
dx = np.abs(np.diff(suave, axis=1))[:-1, :]          # cambios en horizontal
dy = np.abs(np.diff(suave, axis=0))[:, :-1]          # cambios en vertical
bordes = np.sqrt(dx ** 2 + dy ** 2)
bordes = np.clip(bordes * 6, 0, 255).astype(np.uint8)

mostrar(gris, bordes, titulos=["original", "bordes"])
```

## Retos

**1.** Crea una versión **sepia** del paisaje. La fórmula es una matriz de 3×3 que se aplica a cada píxel: `sepia = paisaje @ M.T`, con `M = [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]]`. No olvides recortar a 255.

```python solucion
M = np.array([[0.393, 0.769, 0.189],
              [0.349, 0.686, 0.168],
              [0.272, 0.534, 0.131]])
sepia = np.clip(paisaje @ M.T, 0, 255).astype(np.uint8)
mostrar(paisaje, sepia, titulos=["original", "sepia"])
```

**2.** Añade un **marco** negro de 10 píxeles alrededor del paisaje (pista: `np.pad` con `constant_values=0`, y solo en los dos primeros ejes).

```python solucion
con_marco = np.pad(paisaje, ((10, 10), (10, 10), (0, 0)), constant_values=0)
print(con_marco.shape)
mostrar(con_marco)
```

**3.** Haz un efecto **viñeta**: oscurece la imagen progresivamente hacia los bordes. Pista: calcula la distancia de cada píxel al centro con `filas` y `cols`, conviértela en un factor entre 1 (centro) y 0.2 (esquinas) y multiplica con broadcasting.

```python solucion
dist = np.sqrt((filas - alto / 2) ** 2 + (cols - ancho / 2) ** 2)
factor = 1 - 0.8 * dist / dist.max()
vineta = (paisaje * factor[..., np.newaxis]).astype(np.uint8)
mostrar(paisaje, vineta, titulos=["original", "viñeta"])
```
