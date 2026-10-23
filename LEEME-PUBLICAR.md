# Publicar PunillaGO en Firebase Hosting

Archivos de este paquete (copiarlos dentro de tu proyecto, en la misma carpeta donde está angular.json):
- firebase.json            (configuración del hosting)
- .firebaserc              (indica que el proyecto es "punillago")
- src/app/app.routes.ts    (la pantalla de carga de datos de ejemplo no existe en la versión publicada)
OJO: .firebaserc empieza con un punto; si el Explorador de Windows no lo muestra, activá "Elementos ocultos".

## Primera vez (una sola vez)
1. Instalar la herramienta de Firebase:
       npm install -g firebase-tools
   Termina con algo como: added 600 packages
2. Iniciar sesión:
       firebase login
   Se abre el navegador: elegí tu cuenta de Google y aceptá. En la terminal debe decir: Success! Logged in as tu@correo

## Cada vez que quieras publicar
1. Compilar la versión de producción:
       npx ng build
   Al final debe decir: Output location: ...\dist\punillago
   (Los dos avisos amarillos —tamaño inicial y leaflet— son normales.)
2. Subirla:
       firebase deploy --only hosting
   Al final debe decir: Deploy complete!  y  Hosting URL: https://punillago.web.app
3. Abrí esa dirección y probá: inicio, explorar, mapa, ingresar, favoritos.

## Si algo falla
- "firebase no se reconoce como comando": cerrá y abrí de nuevo la terminal de VS Code.
- "Hosting site not found": en la consola de Firebase entrá a Hosting → "Comenzar" y terminá el asistente; después repetí el deploy.
- La página publicada muestra el inicio pero no los comercios: revisá src/environments/environment.ts (los datos de Firebase) y las reglas de Firestore.
