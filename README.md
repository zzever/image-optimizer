# 🖼️ Image Optimizer

Web app para optimizar imágenes según su tipo:

- **Logos** → Vectorización y optimización SVG + Base64
- **Retratos** → Conversión a AVIF/WebP con calidad controlada
- **Paisajes** → AVIF responsive + placeholder Base64 blur-up
- **Quitar fondo** → Eliminación de fondo en navegador + PNG transparente + Base64

## Stack

- Frontend: HTML + CSS + Vanilla JS
- Procesado: Web APIs nativas (Canvas, FileReader, Blob)
- Eliminación de fondo: `@imgly/background-removal` vía ESM CDN
- Sin backend requerido — compatible con GitHub Pages

## Funciones

- Conversión y optimización de imágenes por tipo de uso
- Generación de Data URI Base64
- Minificación SVG básica
- Placeholder blur-up para paisajes
- Eliminación de fondo local en el navegador con descarga PNG

## Uso

Abre `index.html` directamente en el navegador o despliega en GitHub Pages.

## Despliegue en GitHub Pages

1. Ve a Settings → Pages
2. Source: `main` branch, carpeta `/root`
3. Guarda y accede a `https://zzever.github.io/image-optimizer`

## Nota sobre background removal

La primera ejecución puede tardar más porque el modelo se descarga y queda cacheado en el navegador.
