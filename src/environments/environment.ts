// Datos de la app web de Firebase (no son secretos; la seguridad la dan las reglas de Firestore).
const firebaseConfig = {
  apiKey: 'AIzaSyAng06lSmEojFtAcS2ygpVCgmBWdFR7OP0',
  authDomain: 'punillago.firebaseapp.com',
  projectId: 'punillago',
  storageBucket: 'punillago.firebasestorage.app',
  messagingSenderId: '667531291325',
  appId: '1:667531291325:web:eb87b4a68065cc390225d4',
  measurementId: 'G-GMVG9W3DPR',
};

export const environment = {
  production: false,
  firebase: firebaseConfig,
  regionId: 'punilla',
};
