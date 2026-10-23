import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'PunillaGO · Todo Punilla en un solo lugar',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'explorar',
    title: 'Explorar · PunillaGO',
    loadComponent: () => import('./features/explorar/explorar').then((m) => m.Explorar),
  },
  {
    path: 'lugar/:id',
    title: 'Comercio · PunillaGO',
    loadComponent: () => import('./features/lugar/lugar').then((m) => m.Lugar),
  },
  {
    path: 'mapa',
    title: 'Mapa · PunillaGO',
    loadComponent: () => import('./features/mapa/mapa').then((m) => m.Mapa),
  },
  {
    path: 'eventos',
    title: 'Eventos · PunillaGO',
    loadComponent: () => import('./features/eventos/eventos').then((m) => m.Eventos),
  },
  {
    path: 'promociones',
    title: 'Promociones · PunillaGO',
    loadComponent: () => import('./features/promociones/promociones').then((m) => m.Promociones),
  },
  {
    path: 'favoritos',
    title: 'Favoritos · PunillaGO',
    loadComponent: () => import('./features/favoritos/favoritos').then((m) => m.Favoritos),
  },
  {
    path: 'ingresar',
    title: 'Ingresar · PunillaGO',
    loadComponent: () => import('./features/auth/ingresar').then((m) => m.Ingresar),
  },
  {
    path: 'panel',
    title: 'Mi comercio · PunillaGO',
    loadComponent: () => import('./features/panel/panel').then((m) => m.Panel),
  },
  {
    path: 'admin',
    title: 'Administración · PunillaGO',
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  {
    path: 'perfil',
    title: 'Mi perfil · PunillaGO',
    loadComponent: () => import('./features/auth/perfil').then((m) => m.Perfil),
  },
  ...(isDevMode()
    ? [{ path: 'dev/seed', title: 'Cargar datos', loadComponent: () => import('./features/dev/seed').then((m) => m.Seed) }]
    : []),
  { path: '**', redirectTo: '' },
];
