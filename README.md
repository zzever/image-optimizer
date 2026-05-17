# 🖼️ Image Optimizer

Web app para optimizar imágenes según su tipo:

- **Logos** → Vectorización y optimización SVG + Base64
- **Retratos** → Conversión a AVIF/WebP con calidad controlada
- **Paisajes** → AVIF responsive + placeholder Base64 blur-up

## Stack

- Frontend: HTML + CSS + Vanilla JS (sin dependencias)
- Procesado: Web APIs nativas (Canvas, FileReader, OffscreenCanvas)
- Sin backend requerido — todo en el navegador

## Uso

Abre `index.html` directamente en el navegador o despliega en GitHub Pages.

## Despliegue en GitHub Pages

1. Ve a Settings → Pages
2. Source: `main` branch, carpeta `/root`
3. Guarda y accede a `https://zzever.github.io/image-optimizer`
