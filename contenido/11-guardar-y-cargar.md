---
titulo: Guardar y cargar datos
resumen: Guardar arrays en el formato propio de NumPy, leer y escribir ficheros CSV y de texto, y subir o descargar ficheros en Google Colab.
bloque: Herramientas
duracion: 25 min
objetivos: Guardar y cargar con np.save, np.load y np.savez | Leer CSV con np.loadtxt y np.genfromtxt | Elegir el formato adecuado para cada caso
---
```python
import numpy as np
```

## El formato de NumPy: `.npy` y `.npz`

La forma más rápida y fiel de guardar un array es el formato binario de NumPy. Conserva exactamente la forma, el tipo y los valores.

```python
rng = np.random.default_rng(0)
medidas = rng.normal(20, 3, size=(1000, 4))

np.save("medidas.npy", medidas)
cargadas = np.load("medidas.npy")

print(cargadas.shape, cargadas.dtype)
print("¿Idénticas?", np.array_equal(medidas, cargadas))
```

Para guardar **varios arrays en un solo fichero**, usa `np.savez`, poniendo un nombre a cada uno. `savez_compressed` hace lo mismo comprimiendo:

```python
x = np.linspace(0, 10, 50)
y = np.sin(x)

np.savez_compressed("experimento.npz", x=x, y=y, parametros=np.array([0.5, 2.0]))

datos = np.load("experimento.npz")
print(list(datos.keys()))
print(datos["parametros"])
```

## Ficheros de texto y CSV

Los CSV (valores separados por comas) son legibles por personas y por cualquier programa, como Excel, pandas o R, pero son más lentos y ocupan más.

### Escribir

```python
tabla = np.array([
    [1, 21.5, 60.2],
    [2, 22.1, 58.9],
    [3, 23.4, 55.0],
    [4, 22.8, 57.3],
])

np.savetxt("sensores.csv", tabla, delimiter=",", fmt=["%d", "%.1f", "%.1f"],
           header="hora,temperatura,humedad", comments="")

print(open("sensores.csv").read())
```

### Leer con `loadtxt`

```python
leidos = np.loadtxt("sensores.csv", delimiter=",", skiprows=1)
leidos
```

Puedes leer solo algunas columnas:

```python
temperatura = np.loadtxt("sensores.csv", delimiter=",", skiprows=1, usecols=1)
temperatura
```

### Datos incompletos: `genfromtxt`

`loadtxt` falla si falta algún valor. `genfromtxt` es más flexible y rellena los huecos con `nan`:

```python
with open("incompleto.csv", "w") as f:
    f.write("hora,temperatura,humedad\n1,21.5,60.2\n2,,58.9\n3,23.4,\n")

np.genfromtxt("incompleto.csv", delimiter=",", skip_header=1)
```

Con `names=True` usa la cabecera para nombrar las columnas:

```python
datos = np.genfromtxt("incompleto.csv", delimiter=",", names=True)
print(datos["temperatura"])
```

> Para tablas con texto, fechas y columnas de tipos distintos, la herramienta habitual es **pandas** (`pd.read_csv`), que está construida sobre NumPy. Con `df.to_numpy()` pasas de una tabla de pandas a un array.

## ¿Qué formato elijo?

| Formato | Ventajas | Inconvenientes | Úsalo para |
|---|---|---|---|
| `.npy` | rápido, exacto, conserva el dtype | solo lo lee NumPy | arrays intermedios de tus scripts |
| `.npz` | varios arrays, comprimible | solo lo lee NumPy | guardar los resultados de un experimento |
| `.csv` / `.txt` | universal, legible | lento, ocupa más, pierde precisión | compartir con otras herramientas |

Comparemos tamaños:

```python
import os

np.savetxt("medidas.csv", medidas, delimiter=",")
np.savez_compressed("medidas.npz", medidas=medidas)

for nombre in ["medidas.npy", "medidas.npz", "medidas.csv"]:
    print(f"{nombre:12} {os.path.getsize(nombre) / 1024:7.1f} KB")
```

## Seguridad: `allow_pickle`

Un `.npy` puede contener objetos de Python arbitrarios guardados con *pickle*, y cargar un pickle de origen desconocido puede ejecutar código malicioso. Por eso `np.load` tiene `allow_pickle=False` por defecto. **No lo actives con ficheros que no sean tuyos.**

## Ficheros en Google Colab

Los ficheros que guardas en Colab viven en una máquina temporal que se borra al cerrar la sesión. Para conservarlos:

```python noexec
# Descargar un fichero a tu ordenador
from google.colab import files
files.download("medidas.npy")

# Subir un fichero desde tu ordenador
subidos = files.upload()

# O montar tu Google Drive y guardar allí
from google.colab import drive
drive.mount("/content/drive")
np.save("/content/drive/MyDrive/medidas.npy", medidas)
```

También puedes leer datos directamente de una URL:

```python noexec
url = "https://raw.githubusercontent.com/numpy/numpy-tutorials/main/content/transistor_data.csv"
datos = np.loadtxt(url, delimiter=",", usecols=[1, 2], skiprows=1)
```

## Ejercicios

**1.** Crea una matriz de 5×5 con la tabla de multiplicar, guárdala en `tabla.npy`, cárgala en otra variable y comprueba que es idéntica.

```python solucion
tabla = np.arange(1, 6)[:, None] * np.arange(1, 6)
np.save("tabla.npy", tabla)
np.array_equal(tabla, np.load("tabla.npy"))
```

**2.** Guarda en un único fichero comprimido tres arrays: `x` (100 puntos entre 0 y 1), `x2` (su cuadrado) y `x3` (su cubo). Cárgalo y muestra la forma de cada uno.

```python solucion
x = np.linspace(0, 1, 100)
np.savez_compressed("potencias.npz", x=x, x2=x ** 2, x3=x ** 3)
with np.load("potencias.npz") as f:
    for nombre in f:
        print(nombre, f[nombre].shape)
```

**3.** Lee `incompleto.csv` con `genfromtxt` y calcula la media de cada columna ignorando los valores que faltan.

```python solucion
datos = np.genfromtxt("incompleto.csv", delimiter=",", skip_header=1)
np.nanmean(datos, axis=0)
```
