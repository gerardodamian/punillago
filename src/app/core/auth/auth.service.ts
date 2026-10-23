import { Injectable, inject, signal } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { FirebaseService } from '../firebase/firebase.service';

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El correo no es válido.',
  'auth/missing-password': 'Escribí tu contraseña.',
  'auth/weak-password': 'La contraseña es muy corta: usá al menos 6 caracteres.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Probá ingresar.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu internet.',
  'auth/operation-not-allowed': 'El ingreso con correo no está activado en Firebase (Authentication → Sign-in method).',
};

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  return MESSAGES[code] ?? 'No pudimos completar la acción. Intentá de nuevo.';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FirebaseService).auth;

  /** Usuario actual (null si no ingresó). `equal: () => false` para que avise también cuando cambia su nombre. */
  readonly user = signal<User | null>(null, { equal: () => false });
  /** false hasta que Firebase termina de revisar si ya había una sesión iniciada. */
  readonly ready = signal(false);

  constructor() {
    onAuthStateChanged(this.auth, (u) => {
      this.user.set(u);
      this.ready.set(true);
    });
  }

  async signUp(name: string, email: string, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    this.user.set(this.auth.currentUser);
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }
}
