# PunillaGO — Módulo 4 (usuarios, favoritos y reseñas)

## 1. Activar el login en Firebase
1. Consola de Firebase → proyecto punillago → Authentication → "Comenzar" (si todavía no lo hiciste).
2. Pestaña "Sign-in method" → "Correo electrónico/contraseña" → activar la primera opción → Guardar.

## 2. Reemplazar las reglas de Firestore
Firestore Database → pestaña Reglas → Ctrl + A, Supr, pegar lo siguiente y tocar Publicar:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        match /regions/{id}    { allow read: if true; allow write: if false; }
        match /categories/{id} { allow read: if true; allow write: if false; }

        match /places/{id} {
          allow read: if resource.data.status == 'published';
          allow write: if false;
        }

        // Reseñas: una por persona y comercio (el id del documento es el uid)
        match /places/{placeId}/reviews/{uid} {
          allow read: if true;
          allow create, update: if request.auth != null
            && request.auth.uid == uid
            && request.resource.data.keys().hasOnly(['userId', 'userName', 'rating', 'text', 'createdAt'])
            && request.resource.data.userId == uid
            && request.resource.data.userName is string && request.resource.data.userName.size() <= 60
            && request.resource.data.rating is int && request.resource.data.rating >= 1 && request.resource.data.rating <= 5
            && request.resource.data.text is string && request.resource.data.text.size() <= 500
            && request.resource.data.createdAt == request.time;
          allow delete: if request.auth != null && request.auth.uid == uid;
        }

        // Favoritos: cada persona solo ve y modifica los suyos
        match /users/{uid}/favorites/{placeId} {
          allow read, write: if request.auth != null && request.auth.uid == uid;
        }

        match /events/{id} {
          allow read: if resource.data.status == 'published';
          allow write: if false;
        }
        match /promotions/{id} {
          allow read: if resource.data.status == 'published';
          allow write: if false;
        }
        match /news/{id} {
          allow read: if resource.data.status == 'published';
          allow write: if false;
        }
      }
    }

## 3. Copiar los archivos
Copiá el contenido de la carpeta `punillago` del zip dentro de tu proyecto, aceptando reemplazar.
No hay que instalar nada nuevo: el login viene en la librería de Firebase que ya tenés.

## 4. Probar
    npx ng serve
1. Arriba a la derecha aparece "Ingresar". Creá una cuenta (nombre, correo, contraseña de 6 o más caracteres).
2. Abrí un comercio: "Guardar" lo agrega a Favoritos (pestaña de abajo). Si no ingresaste, te lleva a ingresar y vuelve.
3. En la misma ficha, más abajo, elegí estrellas, escribí una opinión y tocá "Publicar". Podés actualizarla o eliminarla.
4. Tu inicial en el círculo verde abre tu perfil, donde está "Cerrar sesión".

## Nota
La calificación grande de cada comercio (★ 4.8) todavía es la de los datos de ejemplo. El promedio real
calculado con las reseñas se hace más adelante con una Cloud Function, porque es el servidor el que debe
calcularlo (si lo hiciera la app, cualquiera podría falsearlo).

Al hacer `npx ng build` vas a ver dos avisos amarillos (tamaño inicial y que Leaflet no es ESM).
Son avisos, no errores, y no impiden publicar.
