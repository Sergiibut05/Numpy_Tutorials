---
titulo: Proyecto: la ley de Moore con datos reales
resumen: Comprobar con datos reales de procesadores si el número de transistores se duplica cada dos años, usando logaritmos, regresión lineal y gráficos.
bloque: Proyectos
duracion: 45 min
objetivos: Cargar un CSV real desde internet | Linealizar un crecimiento exponencial con logaritmos | Ajustar un modelo y sacar conclusiones de él
---
Este proyecto está basado en el tutorial oficial [Determining Moore's Law with real data in NumPy](https://numpy.org/numpy-tutorials/mooreslaw-tutorial/). Usaremos lo aprendido sobre carga de datos (lección 11), operaciones vectorizadas (5), estadística (7) y regresión (10).

## La pregunta

En 1965, Gordon Moore (cofundador de Intel) predijo que el número de transistores de un chip se **duplicaría cada dos años**. ¿Se ha cumplido? Si se duplica cada 2 años, el número de transistores sigue esta fórmula:

$$\text{transistores}(\text{año}) = T_0 \cdot 2^{(\text{año} - 1971)/2}$$

donde $T_0$ es el número de transistores en 1971, el año del primer microprocesador (el Intel 4004, con unos 2250).

## 1. Cargar los datos

El fichero tiene una fila por procesador. Nos interesan la columna 1 (número de transistores) y la 2 (año de lanzamiento):

```python
import numpy as np
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/numpy/numpy-tutorials/main/content/transistor_data.csv"
datos = np.loadtxt(url, delimiter=",", usecols=[1, 2], skiprows=1)

transistores = datos[:, 0]
anios = datos[:, 1]

print(datos.shape)
print(datos[:5])
```

Un primer vistazo:

```python
print("Procesadores:", len(anios))
print("Años:", int(anios.min()), "a", int(anios.max()))
print(f"Transistores: de {transistores.min():,.0f} a {transistores.max():,.0f}")
```

## 2. Dibujar los datos

```python
plt.figure(figsize=(7, 3.5))
plt.scatter(anios, transistores, s=12, color="#4D77CF")
plt.xlabel("año")
plt.ylabel("transistores")
plt.title("Escala lineal")
plt.show()
```

En escala lineal no se ve nada: los procesadores recientes tienen miles de millones de transistores y aplastan a todos los demás. Esa forma de "palo de hockey" es típica del **crecimiento exponencial**.

## 3. El truco: logaritmos

Si algo crece de forma exponencial, su **logaritmo crece en línea recta**. Tomando logaritmos en base 10 en la fórmula de Moore:

$$\log_{10}(\text{transistores}) = \underbrace{\frac{\log_{10} 2}{2}}_{\text{pendiente}} \cdot \text{año} + \text{constante}$$

O sea: si Moore tenía razón, al dibujar $\log_{10}$(transistores) frente al año deberíamos ver una recta con pendiente $\log_{10}(2)/2 \approx 0.15$.

```python
log_t = np.log10(transistores)

plt.figure(figsize=(7, 3.5))
plt.scatter(anios, log_t, s=12, color="#4D77CF")
plt.xlabel("año")
plt.ylabel("log10(transistores)")
plt.title("Escala logarítmica")
plt.show()
```

¡Ahora sí parece una recta!

## 4. Ajustar la recta

Usamos mínimos cuadrados, igual que en la lección 10. Restamos 1971 a los años para que el término independiente tenga sentido (el valor en 1971):

```python
x = anios - 1971
X = np.column_stack([x, np.ones_like(x)])

(pendiente, ordenada), *_ = np.linalg.lstsq(X, log_t)
print(f"pendiente = {pendiente:.4f}   (Moore predice {np.log10(2) / 2:.4f})")
print(f"ordenada  = {ordenada:.3f}  → {10 ** ordenada:,.0f} transistores en 1971")
```

## 5. ¿Cada cuánto se duplican?

Si cada año el logaritmo sube `pendiente`, la cantidad se multiplica por $10^{\text{pendiente}}$ al año. El tiempo para duplicarse es el número de años $d$ tal que $10^{\text{pendiente} \cdot d} = 2$:

```python
crecimiento_anual = 10 ** pendiente
duplicacion = np.log10(2) / pendiente

print(f"Los transistores se multiplican por {crecimiento_anual:.3f} cada año")
print(f"Se duplican cada {duplicacion:.2f} años")
```

Muy cerca de los 2 años que predijo Moore.

## 6. Modelo frente a realidad

Dibujamos los datos, nuestro ajuste y la predicción original de Moore, en escala logarítmica:

```python
anios_linea = np.linspace(1971, 2020, 100)
ajuste = 10 ** (pendiente * (anios_linea - 1971) + ordenada)
moore = 2250 * 2 ** ((anios_linea - 1971) / 2)

plt.figure(figsize=(7, 4))
plt.semilogy(anios, transistores, "o", markersize=3, color="#4D77CF", label="procesadores reales")
plt.semilogy(anios_linea, ajuste, color="#1B2A4A", label=f"ajuste: x2 cada {duplicacion:.1f} años")
plt.semilogy(anios_linea, moore, "--", color="#E0A800", label="Moore: x2 cada 2 años")
plt.xlabel("año")
plt.ylabel("transistores (escala log)")
plt.legend()
plt.show()
```

## 7. ¿Qué tal predice el modelo?

Comparemos la predicción con el procesador más grande de cada año, en los años más recientes del dataset:

```python
def predecir(anio):
    return 10 ** (pendiente * (anio - 1971) + ordenada)

for anio in np.unique(anios)[-5:]:
    real = transistores[anios == anio].max()
    print(f"{int(anio)}: real {real:>16,.0f} | modelo {predecir(anio):>16,.0f} | ratio {real / predecir(anio):.2f}")
```

¿Y qué diría el modelo para 2030? (Las extrapolaciones lejanas hay que tomarlas con mucha precaución: las leyes físicas de la miniaturización ponen límites.)

```python
f"{predecir(2030):,.0f} transistores"
```

## 8. Calidad del ajuste: R²

El **coeficiente de determinación** $R^2$ mide qué parte de la variación de los datos explica el modelo (1 = perfecto, 0 = nada):

```python
prediccion_log = pendiente * x + ordenada
residuos = log_t - prediccion_log
r2 = 1 - (residuos ** 2).sum() / ((log_t - log_t.mean()) ** 2).sum()
print(f"R² = {r2:.3f}")
```

## 9. Guardar los resultados

```python
np.savez("moore_resultados.npz",
         anios=anios, transistores=transistores,
         pendiente=pendiente, ordenada=ordenada, duplicacion=duplicacion)
print(list(np.load("moore_resultados.npz").keys()))
```

## Retos

**1.** Repite el ajuste usando **solo los procesadores a partir del año 2000**. ¿Se ha frenado la ley de Moore?

```python solucion
recientes = anios >= 2000
p_rec, o_rec = np.polyfit(anios[recientes] - 1971, log_t[recientes], 1)
print(f"Desde 2000 se duplican cada {np.log10(2) / p_rec:.2f} años")
```

**2.** Calcula la **mediana** de transistores por año y dibújala junto a los datos. Pista: recorre `np.unique(anios)` con una máscara.

```python solucion
anios_unicos = np.unique(anios)
medianas = np.array([np.median(transistores[anios == a]) for a in anios_unicos])

plt.figure(figsize=(7, 3.5))
plt.semilogy(anios, transistores, "o", markersize=3, alpha=0.4, label="procesadores")
plt.semilogy(anios_unicos, medianas, "-", color="#1B2A4A", label="mediana por año")
plt.legend()
plt.show()
```

**3.** ¿Qué procesador está más **por encima** del modelo (el residuo más grande)? Busca su año y su número de transistores con `argmax`.

```python solucion
i = residuos.argmax()
print(f"Año {int(anios[i])}: {transistores[i]:,.0f} transistores, "
      f"{10 ** residuos[i]:.1f} veces más de lo que predice el modelo")
```
