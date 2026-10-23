# PunillaGO — Módulo 1 (base del proyecto)

## Cómo ponerlo a andar (Windows + VS Code)

1. Instalá Node.js 22 LTS desde https://nodejs.org (si ya lo tenés, `node -v` debe mostrar v20.19 o superior).
2. Descomprimí el zip, abrí la carpeta `punillago` en VS Code y abrí la terminal (Ctrl + ñ).
3. Instalá las dependencias (tarda unos minutos la primera vez):

       npm install

   Al final debería decir algo como `added 6xx packages`.
4. Levantá el proyecto:

       npx ng serve

   Debería mostrar `Local: http://localhost:4200/`. Abrilo en el navegador.
5. Para verlo como celular: F12 → ícono de dispositivos (Ctrl + Shift + M).

## Qué incluye
- Layout: encabezado con logo y navegación inferior para celular.
- Inicio: portada con buscador, categorías y comercios destacados (datos de ejemplo).
- Componentes base reutilizables: buscador, categoría, tarjeta de comercio.
- Rutas con carga diferida (explorar, mapa, eventos y favoritos son pantallas provisorias).
- Estilos con los colores del logo en `src/styles.scss` (variables CSS).
- Firebase listo: completá tus datos en `src/environments/environment.ts`.

## Dónde tocar
- Colores y tipografías: `src/styles.scss`
- Datos de ejemplo: `src/app/data-access/places.repository.ts`
- Nuevas pantallas: `src/app/features/` + una ruta en `src/app/app.routes.ts`

## Para publicar
    npx ng build
El resultado queda en `dist/punillago/browser`.

## Próximo módulo
Listados con filtros y ficha del comercio, conectados a Firestore.
