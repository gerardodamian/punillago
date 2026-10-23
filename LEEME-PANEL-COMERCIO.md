# PunillaGO — Panel del comercio

Cada comercio tiene un dueño (campo `ownerId` = código de usuario). El dueño ingresa a "Mi comercio" y edita:
nombre, descripción, servicios, horarios, teléfono, WhatsApp, dirección y ubicación en el mapa.
NO puede tocar: plan, estado de publicación, destacado, calificación ni dueño (lo bloquean las reglas).

## 1. Reemplazar las reglas de Firestore
Firestore Database → Reglas → Ctrl + A, Supr, pegar y Publicar:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // Valida los datos que puede cambiar el dueño de un comercio
        function validPlace(d) {
          return d.name is string && d.name.size() >= 2 && d.name.size() <= 80
            && d.description is string && d.description.size() <= 1500
            && d.services is list && d.services.size() <= 15
            && d.get('phone', '') is string && d.get('phone', '').size() <= 30
            && d.get('whatsapp', '') is string && d.get('whatsapp', '').matches('^[0-9]{0,15}$')
            && d.get('address', '') is string && d.get('address', '').size() <= 120
            && d.get('hours', '') is string && d.get('hours', '').size() <= 200
            && (!('lat' in d) || (d.lat is number && d.lat >= -90 && d.lat <= 90))
            && (!('lng' in d) || (d.lng is number && d.lng >= -180 && d.lng <= 180));
        }

        match /regions/{id}    { allow read: if true; allow write: if false; }
        match /categories/{id} { allow read: if true; allow write: if false; }

        match /places/{id} {
          // Todos ven lo publicado; el dueño ve además sus comercios no publicados
          allow read: if resource.data.status == 'published'
            || (request.auth != null && resource.data.ownerId == request.auth.uid);

          // Solo el dueño, solo estos campos
          allow update: if request.auth != null
            && resource.data.ownerId == request.auth.uid
            && request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['name', 'description', 'services', 'phone', 'whatsapp', 'address', 'hours', 'lat', 'lng', 'updatedAt'])
            && request.resource.data.updatedAt == request.time
            && validPlace(request.resource.data);

          allow create, delete: if false;
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

## 2. Copiar los archivos
Copiá el contenido de la carpeta `punillago` del zip dentro de tu proyecto, aceptando reemplazar. No hay que instalar nada.

## 3. Vincular un comercio con su dueño (lo hacés vos, en la consola)
1. El dueño crea su cuenta en la app, entra a Perfil y toca "Copiar código" (o lo ves en Firebase → Authentication → Usuarios, columna "UID de usuario").
2. Firebase → Firestore → Datos → colección `places` → el documento del comercio.
3. "Agregar campo": nombre `ownerId`, tipo `string`, valor = el código. Guardar.
4. Opcional, para mostrar el plan: otro campo `plan` (string) con `free`, `basic`, `premium` o `featured`.
5. El dueño entra a Perfil → "Mi comercio" y ya puede editar.

Para probarlo vos: usá tu propia cuenta y vinculala a uno de los comercios de ejemplo (por ejemplo `cabanas-del-rio`).

## 4. Probar
- Cambiá la descripción y el WhatsApp, tocá "Guardar cambios" y abrí "Ver mi ficha pública": tiene que mostrar lo nuevo.
- Probá "Usar mi ubicación actual" y mirá el comercio en el mapa.
- Entrá con otra cuenta que no sea dueña: "Mi comercio" tiene que decir que no hay comercio vinculado.

## Qué falta (próximos pasos)
- Fotos y logo (requiere activar Firebase Storage, que pide el plan Blaze con tarjeta; tiene cuota gratis).
- Que el dueño publique promociones y eventos (módulo 5).
- Cobro automático de planes (Cloud Functions + Mercado Pago). Por ahora el plan lo cambiás vos a mano.
