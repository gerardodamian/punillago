# PunillaGO — Módulo 5 (promociones y eventos)

Los comercios publican promociones y eventos desde "Mi comercio". Se ven en:
- Inicio (promociones y próximos eventos)
- Pestaña "Eventos" (agrupados por mes, con filtro por tipo) y pantalla "Promociones"
- La ficha pública de cada comercio
Las categorías "Eventos" y "Promociones" del inicio ahora abren estas pantallas.

## Qué plan permite qué (lo controlan las reglas de Firestore)
| Plan      | Promociones vigentes | Eventos próximos |
|-----------|----------------------|------------------|
| free      | no puede publicar    | no puede publicar |
| basic     | 1                    | no puede publicar |
| premium   | 3                    | 3 |
| featured  | 10                   | 10 |
Que el plan sea al menos `basic` (promociones) o `premium` (eventos) lo exige el servidor.
Los topes de cantidad (1, 3, 10) los controla hoy la pantalla; más adelante se pasan al servidor.
Podés cambiar los números en `offers-manager.ts` (PROMO_LIMIT y EVENT_LIMIT).

## 1. Reemplazar las reglas de Firestore
Firestore Database → Reglas → Ctrl + A, Supr, pegar y Publicar:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // ---- Datos que puede cambiar el dueño de un comercio ----
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

        // ---- Promociones y eventos: el comercio al que pertenecen ----
        function placeOf(d) {
          return get(/databases/$(database)/documents/places/$(d.placeId)).data;
        }
        function ownsPlaceOf(d) {
          return request.auth != null && placeOf(d).ownerId == request.auth.uid;
        }
        function planOf(d) {
          return placeOf(d).get('plan', 'free');
        }

        function validPromo(d) {
          return d.keys().hasOnly(['placeId', 'placeName', 'regionId', 'title', 'description', 'couponCode', 'validFrom', 'validTo', 'status', 'createdAt'])
            && d.status == 'published'
            && d.placeName == placeOf(d).name
            && d.regionId == placeOf(d).regionId
            && d.title is string && d.title.size() >= 3 && d.title.size() <= 80
            && d.description is string && d.description.size() <= 300
            && d.get('couponCode', '') is string && d.get('couponCode', '').size() <= 20
            && d.validFrom is timestamp && d.validTo is timestamp && d.validTo > d.validFrom
            && d.createdAt == request.time;
        }

        function validEvent(d) {
          return d.keys().hasOnly(['placeId', 'placeName', 'regionId', 'title', 'description', 'type', 'location', 'price', 'startAt', 'status', 'createdAt'])
            && d.status == 'published'
            && d.placeName == placeOf(d).name
            && d.regionId == placeOf(d).regionId
            && d.title is string && d.title.size() >= 3 && d.title.size() <= 80
            && d.description is string && d.description.size() <= 500
            && d.type in ['festival', 'recital', 'pena', 'feria', 'carrera', 'encuentro', 'otro']
            && d.location is string && d.location.size() <= 120
            && d.price is string && d.price.size() <= 40
            && d.startAt is timestamp
            && d.createdAt == request.time;
        }

        match /regions/{id}    { allow read: if true; allow write: if false; }
        match /categories/{id} { allow read: if true; allow write: if false; }

        match /places/{id} {
          allow read: if resource.data.status == 'published'
            || (request.auth != null && resource.data.ownerId == request.auth.uid);

          allow update: if request.auth != null
            && resource.data.ownerId == request.auth.uid
            && request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['name', 'description', 'services', 'phone', 'whatsapp', 'address', 'hours', 'lat', 'lng', 'updatedAt'])
            && request.resource.data.updatedAt == request.time
            && validPlace(request.resource.data);

          allow create, delete: if false;
        }

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

        match /users/{uid}/favorites/{placeId} {
          allow read, write: if request.auth != null && request.auth.uid == uid;
        }

        // Promociones: desde el plan basic
        match /promotions/{id} {
          allow read: if resource.data.status == 'published';
          allow create: if ownsPlaceOf(request.resource.data)
            && planOf(request.resource.data) in ['basic', 'premium', 'featured']
            && validPromo(request.resource.data);
          allow delete: if ownsPlaceOf(resource.data);
          allow update: if false;
        }

        // Eventos: desde el plan premium
        match /events/{id} {
          allow read: if resource.data.status == 'published';
          allow create: if ownsPlaceOf(request.resource.data)
            && planOf(request.resource.data) in ['premium', 'featured']
            && validEvent(request.resource.data);
          allow delete: if ownsPlaceOf(resource.data);
          allow update: if false;
        }

        match /news/{id} {
          allow read: if resource.data.status == 'published';
          allow write: if false;
        }
      }
    }

## 2. Copiar los archivos
Copiá el contenido de la carpeta `punillago` del zip dentro de tu proyecto, aceptando reemplazar. No hay que instalar nada.

## 3. Probar
1. Tu comercio de prueba (cabanas-del-rio) ya tiene `plan` = `premium`, así que puede publicar ambas cosas.
2. Perfil → Mi comercio → bajá hasta "Promociones": cargá un título, fechas de inicio y fin (que incluyan hoy) y "Publicar promoción".
3. Más abajo, en "Eventos": nombre, tipo, una fecha futura y "Publicar evento".
4. Mirá: Inicio, la pestaña Eventos, la pantalla Promociones (desde la categoría del inicio) y la ficha pública del comercio.
5. Para ver el bloqueo por plan: vinculá otro comercio de prueba con tu cuenta (campo ownerId), dejalo sin campo `plan` (o `free`) y entrá a Mi comercio: las dos secciones dicen que están bloqueadas.
   Con `plan` = `basic`, se habilitan las promociones pero los eventos siguen bloqueados.

Recordá: el campo se llama `plan` (minúscula) y los valores son free, basic, premium, featured (minúscula).
