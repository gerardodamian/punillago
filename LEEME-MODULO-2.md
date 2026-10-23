# PunillaGO — Módulo 2 (explorar y ficha del comercio, con Firestore)

## 1. Copiar los archivos
Descomprimí el zip y copiá el contenido de la carpeta `punillago` dentro de tu carpeta del proyecto,
aceptando reemplazar los archivos que ya existen. Se crean/reemplazan:
- src/app/shared/models/models.ts
- src/app/shared/ui/place-card.ts
- src/app/data-access/places.repository.ts
- src/app/features/home/home.ts
- src/app/features/explorar/explorar.ts   (nuevo)
- src/app/features/lugar/lugar.ts         (nuevo)
- src/app/features/dev/seed.ts y seed-data.ts (nuevos, solo para desarrollo)
- src/app/app.routes.ts

## 2. Abrir la escritura por 2 días (solo para cargar los datos de ejemplo)
En Firebase → Firestore Database → pestaña Reglas, reemplazá el bloque `match /places/{id} { ... }` por este:

    match /places/{id} {
      allow read: if resource.data.status == 'published';
      allow write: if request.time < timestamp.date(2026, 10, 7);
    }

Tocá Publicar. Esa línea se cierra sola el 7 de octubre de 2026, pero igual conviene volver a ponerla
en `allow write: if false;` apenas termines (paso 4).

## 3. Cargar los datos
1. Con `npx ng serve` andando, abrí http://localhost:4200/dev/seed
2. Tocá "Cargar comercios". Debería decir: "Listo: 12 comercios cargados."
3. En Firebase → Firestore → Datos tiene que aparecer la colección `places` con 12 documentos.

## 4. Cerrar la escritura
Volvé a Reglas y dejá `places` así:

    match /places/{id} {
      allow read: if resource.data.status == 'published';
      allow write: if false;
    }

Publicar. Después de esto /dev/seed ya no puede escribir (da permission-denied), y está bien.

## 5. Probar
- Inicio: aparecen 4 destacados.
- Explorar: buscador, categorías y precio. Los filtros quedan en la URL.
- Tocar un comercio: ficha con WhatsApp, Llamar, Cómo llegar y Compartir.

Los teléfonos y WhatsApp de ejemplo son ficticios. Los números de WhatsApp van solo con dígitos,
con código de país y sin el 9 (ej: 543548123456).
