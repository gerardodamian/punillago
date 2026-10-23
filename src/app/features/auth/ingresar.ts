import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-ingresar',
  imports: [RouterLink],
  template: `
    <section class="container box">
      <h1>{{ mode() === 'login' ? 'Ingresá a PunillaGO' : 'Creá tu cuenta' }}</h1>
      <p class="sub">Guardá tus favoritos y dejá tu opinión sobre los lugares que visitaste.</p>

      @if (auth.user(); as u) {
        <p class="ok">Ya ingresaste como {{ u.displayName || u.email }}.</p>
        <a routerLink="/perfil" class="link">Ir a mi perfil</a>
      } @else {
        <form (submit)="submit($event)">
          @if (mode() === 'signup') {
            <label>
              Nombre
              <input type="text" autocomplete="name" [value]="name()" (input)="name.set($any($event.target).value)" />
            </label>
          }
          <label>
            Correo
            <input type="email" autocomplete="email" [value]="email()" (input)="email.set($any($event.target).value)" />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              [attr.autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
              [value]="password()"
              (input)="password.set($any($event.target).value)" />
          </label>

          @if (error()) {
            <p class="err" role="alert">{{ error() }}</p>
          }

          <button type="submit" [disabled]="busy()">
            {{ busy() ? 'Un momento…' : mode() === 'login' ? 'Ingresar' : 'Crear cuenta' }}
          </button>
        </form>

        <button type="button" class="switch" (click)="toggleMode()">
          {{ mode() === 'login' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Ingresá' }}
        </button>
      }
    </section>
  `,
  styles: `
    .box { padding-top: 28px; display: grid; gap: 12px; max-width: 460px; }
    .sub { margin: 0; color: var(--muted); }
    form { display: grid; gap: 12px; }
    label { display: grid; gap: 6px; font-size: 13px; font-weight: 600; }
    input { padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; font: inherit; font-size: 15px;
      background: var(--surface); outline: 0; }
    input:focus { border-color: var(--green-500); }
    form button { border: 0; border-radius: 999px; padding: 13px; background: var(--green-700); color: #fff; font-weight: 600;
      font-size: 15px; }
    form button:disabled { opacity: 0.6; }
    .switch { border: 0; background: none; color: var(--green-700); font-weight: 600; padding: 8px; }
    .err { margin: 0; color: #b3261e; font-size: 13px; }
    .ok { margin: 0; color: var(--green-700); font-weight: 600; }
    .link { color: var(--green-700); font-weight: 600; }
  `,
})
export class Ingresar {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly volver = inject(ActivatedRoute).snapshot.queryParamMap.get('volver');

  readonly mode = signal<'login' | 'signup'>('login');
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  toggleMode(): void {
    this.mode.update((m) => (m === 'login' ? 'signup' : 'login'));
    this.error.set('');
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');
    const email = this.email().trim();
    const name = this.name().trim();
    if (this.mode() === 'signup' && !name) {
      this.error.set('Escribí tu nombre.');
      return;
    }
    this.busy.set(true);
    try {
      if (this.mode() === 'signup') await this.auth.signUp(name, email, this.password());
      else await this.auth.signIn(email, this.password());
      // Solo volvemos a rutas internas (que empiezan con una sola barra).
      const dest = this.volver && this.volver.startsWith('/') && !this.volver.startsWith('//') ? this.volver : '/';
      await this.router.navigateByUrl(dest);
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
