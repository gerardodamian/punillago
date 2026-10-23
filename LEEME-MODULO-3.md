# PunillaGO — Módulo 3 (mapa)

## 1. Instalar Leaflet (la librería del mapa)
1. Si `ng serve` está corriendo, pará con Ctrl + C en la terminal.
2. Ejecutá estos dos comandos, uno por vez:

       npm install leaflet
       npm install -D @types/leaflet

   Cada uno termina con un resumen tipo `added 2 packages`. Los avisos de "vulnerabilities" podés ignorarlos.

## 2. Copiar los archivos
Copiá el contenido de la carpeta `punillago` del zip dentro de tu proyecto, aceptando reemplazar:
- src/styles.scss                    (reemplaza: suma el CSS del mapa y los marcadores)
- src/app/app.routes.ts              (reemplaza: la ruta /mapa ahora abre el mapa)
- src/app/core/geo.ts                (nuevo: cálculo de distancias)
- src/app/features/mapa/mapa.ts      (nuevo: pantalla del mapa)

## 3. Probar
    npx ng serve
Abrí http://localhost:4200 y tocá "Mapa" en la barra de abajo.
- Se ven los comercios como círculos con su ícono. Tocá uno para ver el nombre y "Ver ficha".
- Los botones de arriba filtran por categoría.
- "Cerca de mí" pide permiso de ubicación y lista los 5 comercios más cercanos con la distancia.
  (Funciona en localhost y en https; en http común el navegador la bloquea.)

## Nota sobre los mapas
Los mosaicos del mapa vienen de OpenStreetMap, que es gratis para uso liviano y exige mostrar su
atribución (ya viene incluida abajo a la derecha). Si la app llega a tener mucho tráfico, conviene pasar
a un proveedor de mapas comercial; es un cambio de una línea en `mapa.ts`.
