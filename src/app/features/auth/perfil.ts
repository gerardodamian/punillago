import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../core/auth/admin.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink],
  template: `
    <section class="container box">
      @if (!auth.ready()) {
        <p class="note">Cargando…</p>
      } @else if (auth.user(); as u) {
        <div class="avatar" aria-hidden="true">{{ (u.displayName || u.email || '?').charAt(0).toUpperCase() }}</div>
        <h1>{{ u.displayName || 'Mi perfil' }}</h1>
        <p class="note">{{ u.email }}</p>
        <a routerLink="/favoritos" class="btn">❤️ Mis favoritos</a>
        <a routerLink="/panel" class="btn">🏪 Mi comercio</a>
        @if (admin.isAdmin()) {
          <a routerLink="/admin" class="btn">🛠️ Administración</a>
        }
        <button type="button" class="btn out" (click)="logout()">Cerrar sesión</button>

        <div class="uid">
          <p class="note">Tu código de usuario (si tenés un comercio, pasáselo a PunillaGO para vincularlo):</p>
          <code>{{ u.uid }}</code>
          <button type="button" class="copy" (click)="copy(u.uid)">{{ copied() ? 'Copiado' : 'Copiar código' }}</button>
        </div>
      } @else {
        <h1>Mi perfil</h1>
        <p class="note">Ingresá para ver tu perfil.</p>
        <a routerLink="/ingresar" class="btn main">Ingresar</a>
      }
    </section>
  `,
  styles: `
    .box { padding-top: 32px; display: grid; gap: 12px; justify-items: start; max-width: 460px; }
    .avatar { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; background: var(--green-700);
      color: #fff; font-size: 28px; font-weight: 700; }
    .note { margin: 0; color: var(--muted); }
    .btn { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 999px;
      padding: 12px 20px; font-weight: 600; font-size: 14px; }
    .btn.main { background: var(--green-700); border-color: var(--green-700); color: #fff; }
    .btn.out { color: #b3261e; }
    .uid { display: grid; gap: 8px; margin-top: 12px; padding: 14px; width: 100%; background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; }
    code { word-break: break-all; font-size: 13px; color: var(--navy-900); }
    .copy { justify-self: start; border: 0; background: none; color: var(--green-700); font-weight: 600; padding: 0; }
  `,
})
export class Perfil {
  readonly auth = inject(AuthService);
  readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  readonly copied = signal(false);

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // si el navegador no deja copiar, la persona puede seleccionar el código a mano
    }
  }
}
