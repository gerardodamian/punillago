# PunillaGO — Panel de administración

Desde /admin (Perfil → "Administración", solo si sos administradora) podés:
- Ver todos los comercios, publicados o no, con búsqueda y filtro.
- Cambiar estado (borrador, en revisión, publicado, suspendido), plan, fecha hasta la que vale el plan,
  destacado y dueño (ownerId) de cada comercio.
- Crear comercios nuevos (quedan en borrador hasta que los publiques).
- Moderar opiniones: en la ficha de cualquier comercio, la administradora ve "Eliminar (moderación)" en cada opinión.

Vencimiento de planes: si el plan tiene fecha "hasta" y ya pasó, el comercio cuenta como Gratis:
no puede publicar promociones ni eventos (lo controla el servidor) y deja de aparecer como destacado.

## 1. Convertirte en administradora (se hace una sola vez, en la consola)
1. En la app, Perfil → "Copiar código" (tu código de usuario).
2. Firebase → Firestore → Datos → "Iniciar colección".
3. ID de la colección: `admins` → Siguiente.
4. ID del documento: pegá tu código. Campo: `role`, tipo `string`, valor `admin` → Guardar.
(Si el nombre de la colección o del campo lleva mayúsculas, no va a funcionar: todo en minúscula.)

## 2. Reemplazar las reglas de Firestore
Firestore Database → Reglas → Ctrl + A, Supr, pegar y Publicar:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // ---- Administración ----
        function isAdmin() {
          return request.auth != null
            && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
        }
        function validAdminPlace(d) {
          return d.status in ['draft', 'pending', 'published', 'suspended']
            && d.get('plan', 'free') in ['free', 'basic', 'premium', 'featured']
            && d.get('featured', false) is bool
            && d.get('ownerId', '') is string
            && (!('planUntil' in d) || d.planUntil is timestamp);
        }

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
        // Plan vigente hoy: si la fecha "planUntil" ya pasó, vale como gratis
        function planOf(d) {
          let p = placeOf(d);
          return ('planUntil' in p && p.planUntil < request.time) ? 'free' : p.get('plan', 'free');
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

        // Cada persona puede ver si ella misma es administradora (nadie puede escribir acá)
        match /admins/{uid} {
          allow read: if request.auth != null && request.auth.uid == uid;
          allow write: if false;
        }

        match /regions/{id}    { allow read: if true; allow write: if false; }
        match /categories/{id} { allow read: if true; allow write: if false; }

        // Varias líneas "allow" del mismo tipo funcionan como "o": alcanza con que se cumpla una.
        match /places/{id} {
          allow read: if resource.data.status == 'published';
          allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;
          allow read: if isAdmin();

          // El dueño: solo estos campos
          allow update: if request.auth != null
            && resource.data.ownerId == request.auth.uid
            && request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['name', 'description', 'services', 'phone', 'whatsapp', 'address', 'hours', 'lat', 'lng', 'updatedAt'])
            && request.resource.data.updatedAt == request.time
            && validPlace(request.resource.data);
          // La administradora: puede cambiar todo, con valores válidos
          allow update: if isAdmin() && validAdminPlace(request.resource.data);

          allow create: if isAdmin() && validAdminPlace(request.resource.data)
            && request.resource.data.regionId is string;
          allow delete: if false;
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
          allow delete: if isAdmin();
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
          allow delete: if isAdmin();
          allow update: if false;
        }

        // Eventos: desde el plan premium
        match /events/{id} {
          allow read: if resource.data.status == 'published';
          allow create: if ownsPlaceOf(request.resource.data)
            && planOf(request.resource.data) in ['premium', 'featured']
            && validEvent(request.resource.data);
          allow delete: if ownsPlaceOf(resource.data);
          allow delete: if isAdmin();
          allow update: if false;
        }

        match /news/{id} {
          allow read: if resource.data.status == 'published';
          allow write: if false;
        }
      }
    }

## 3. Copiar los archivos
Copiá el contenido de la carpeta `punillago` del zip dentro de tu proyecto, aceptando reemplazar. No hay que instalar nada.

## 4. Probar
1. Perfil: tiene que aparecer el botón "Administración". Entrá.
2. Abrí un comercio, cambiale el plan a Básico y poné una fecha "hasta" de ayer: la etiqueta pasa a "Vencido".
   Con una fecha futura, el plan vuelve a regir.
3. "+ Nuevo comercio": cargá uno de prueba; aparece en borrador. Cambiale el estado a Publicado y mirá que aparezca en Explorar.
4. Entrá a la ficha de un comercio con opiniones de otra cuenta: tiene que aparecer "Eliminar (moderación)".

## Después de esto
- Se sigue sin poder borrar comercios desde la app a propósito (por seguridad); se borran desde la consola.
- El plan seguirá siendo manual hasta que se agregue el cobro automático con Mercado Pago (requiere Cloud Functions).
