import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../core/auth/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { ReviewsRepository } from '../../data-access/reviews.repository';
import { Review } from '../../shared/models/models';

@Component({
  selector: 'app-reviews',
  imports: [RouterLink],
  template: `
    <section class="reviews">
      <h2>Opiniones</h2>

      @if (auth.user(); as u) {
        <div class="form">
          <p class="lbl">{{ mine() ? 'Tu opinión' : 'Dejá tu opinión' }}</p>
          <div class="stars" role="radiogroup" aria-label="Calificación">
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <button type="button" role="radio" [attr.aria-checked]="rating() === n" [attr.aria-label]="n + ' de 5'"
                [class.on]="n <= rating()" (click)="rating.set(n)">★</button>
            }
          </div>
          <textarea rows="3" maxlength="500" placeholder="Contá cómo fue tu experiencia (opcional)"
            [value]="text()" (input)="text.set($any($event.target).value)"></textarea>
          @if (error()) {
            <p class="err" role="alert">{{ error() }}</p>
          }
          <div class="row">
            <button type="button" class="save" (click)="save(u.uid, u.displayName || u.email || 'Usuario')" [disabled]="busy()">
              {{ busy() ? 'Guardando…' : mine() ? 'Actualizar' : 'Publicar' }}
            </button>
            @if (mine()) {
              <button type="button" class="del" (click)="remove(u.uid)" [disabled]="busy()">Eliminar</button>
            }
          </div>
        </div>
      } @else if (auth.ready()) {
        <a class="login" routerLink="/ingresar" [queryParams]="{ volver: router.url }">Ingresá para dejar tu opinión</a>
      }

      @if (status() === 'error') {
        <p class="note">No pudimos cargar las opiniones.</p>
      } @else if (status() === 'ready' && !reviews().length) {
        <p class="note">Todavía no hay opiniones. ¡Sé el primero!</p>
      }

      @for (r of reviews(); track r.userId) {
        <article class="item">
          <div class="head">
            <b>{{ r.userName }}</b>
            <span class="rate" [attr.aria-label]="r.rating + ' de 5'">{{ stars(r.rating) }}</span>
          </div>
          @if (r.text) {
            <p>{{ r.text }}</p>
          }
          @if (r.createdAt) {
            <small>{{ r.createdAt.toLocaleDateString('es-AR') }}</small>
          }
          @if (admin.isAdmin() && r.userId !== auth.user()?.uid) {
            <button type="button" class="mod" (click)="moderate(r)">Eliminar (moderación)</button>
          }
        </article>
      }
    </section>
  `,
  styles: `
    .reviews { display: grid; gap: 10px; margin-top: 16px; }
    h2 { font-size: 16px; }
    .form { display: grid; gap: 8px; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .lbl { margin: 0; font-weight: 600; font-size: 14px; }
    .stars { display: flex; gap: 4px; }
    .stars button { border: 0; background: none; font-size: 30px; line-height: 1; color: #d3d9d4; padding: 0 2px; }
    .stars button.on { color: var(--orange-500); }
    textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font: inherit;
      font-size: 14px; resize: vertical; outline: 0; }
    textarea:focus { border-color: var(--green-500); }
    .row { display: flex; gap: 8px; }
    .save { border: 0; border-radius: 999px; padding: 10px 20px; background: var(--green-700); color: #fff; font-weight: 600; }
    .del { border: 1px solid var(--border); border-radius: 999px; padding: 10px 16px; background: var(--surface); color: #b3261e; font-weight: 600; }
    button:disabled { opacity: 0.6; }
    .err { margin: 0; color: #b3261e; font-size: 13px; }
    .login { color: var(--green-700); font-weight: 600; font-size: 14px; }
    .note { margin: 0; color: var(--muted); font-size: 14px; }
    .item { padding: 12px 0; border-top: 1px solid var(--border); display: grid; gap: 4px; }
    .head { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
    .rate { color: var(--orange-500); letter-spacing: 1px; }
    .item p { margin: 0; line-height: 1.45; font-size: 14px; }
    small { color: var(--muted); }
    .mod { justify-self: start; border: 0; background: none; color: #b3261e; font-weight: 600; font-size: 12px; padding: 0; }
  `,
})
export class Reviews {
  readonly placeId = input.required<string>();

  readonly auth = inject(AuthService);
  readonly admin = inject(AdminService);
  readonly router = inject(Router);
  private readonly repo = inject(ReviewsRepository);

  readonly reviews = signal<Review[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly rating = signal(0);
  readonly text = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  readonly mine = computed(() => this.reviews().find((r) => r.userId === this.auth.user()?.uid) ?? null);

  constructor() {
    // Si la persona ya había opinado, cargamos su reseña en el formulario para que pueda editarla.
    effect(() => {
      const m = this.mine();
      if (m) {
        this.rating.set(m.rating);
        this.text.set(m.text);
      }
    });
    effect(() => void this.load(this.placeId()));
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  private async load(placeId: string): Promise<void> {
    try {
      this.reviews.set(await this.repo.list(placeId));
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  async save(uid: string, name: string): Promise<void> {
    this.error.set('');
    if (this.rating() < 1) {
      this.error.set('Elegí de 1 a 5 estrellas.');
      return;
    }
    this.busy.set(true);
    try {
      await this.repo.save(this.placeId(), uid, name.slice(0, 60), this.rating(), this.text().trim().slice(0, 500));
      await this.load(this.placeId());
    } catch {
      this.error.set('No pudimos guardar tu opinión. Intentá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  async moderate(r: Review): Promise<void> {
    if (!confirm('¿Eliminar esta opinión?')) return;
    try {
      await this.repo.remove(this.placeId(), r.userId);
      await this.load(this.placeId());
    } catch {
      this.error.set('No pudimos eliminar la opinión.');
    }
  }

  async remove(uid: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.repo.remove(this.placeId(), uid);
      this.rating.set(0);
      this.text.set('');
      await this.load(this.placeId());
    } catch {
      this.error.set('No pudimos eliminar tu opinión. Intentá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }
}
