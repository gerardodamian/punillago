import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from 'firebase/auth';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <header>
      <a class="brand" routerLink="/" aria-label="PunillaGO, ir al inicio">
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#5b9a32" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/>
          <path fill="#fff" d="M12 6.5 8 13h8z"/>
        </svg>
        <span class="logo">PUNILLA<b>GO</b></span>
      </a>

      @if (auth.ready()) {
        @if (auth.user(); as u) {
          <a class="avatar" routerLink="/perfil" aria-label="Mi perfil">{{ initial(u) }}</a>
        } @else {
          <a class="login" routerLink="/ingresar">Ingresar</a>
        }
      }
    </header>
  `,
  styles: `
    header { position: sticky; top: 0; z-index: 10; height: var(--header-h); display: flex; align-items: center;
      justify-content: space-between; padding: 0 16px; padding-top: env(safe-area-inset-top, 0px);
      background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); }
    .brand { display: flex; align-items: center; gap: 8px; }
    .logo { font-family: var(--font-title); font-weight: 700; font-size: 20px; color: var(--navy-900); letter-spacing: 0.5px; }
    .logo b { color: var(--teal-600); }
    .login { font-size: 14px; font-weight: 600; color: var(--green-700); padding: 8px 14px; border: 1px solid var(--border);
      border-radius: 999px; background: var(--surface); }
    .avatar { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: var(--green-700);
      color: #fff; font-weight: 700; }
  `,
})
export class Header {
  readonly auth = inject(AuthService);

  initial(u: User): string {
    return (u.displayName || u.email || '?').charAt(0).toUpperCase();
  }
}
