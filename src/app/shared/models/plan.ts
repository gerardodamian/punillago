import { Place, PlanTier } from './models';

export const PLAN_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: 'free', label: 'Gratis' },
  { value: 'basic', label: 'Básico' },
  { value: 'premium', label: 'Premium' },
  { value: 'featured', label: 'Destacado' },
];

export const planLabel = (plan: PlanTier) => PLAN_OPTIONS.find((o) => o.value === plan)?.label ?? 'Gratis';

/** Plan que realmente rige hoy: si venció la fecha, es gratis. */
export function effectivePlan(p: Pick<Place, 'plan' | 'planUntil'>): PlanTier {
  if (p.planUntil && p.planUntil.getTime() < Date.now()) return 'free';
  return p.plan ?? 'free';
}

/** Un comercio destacado deja de serlo cuando vence su plan. */
export function isFeatured(p: Place): boolean {
  return p.featured && (!p.planUntil || p.planUntil.getTime() >= Date.now());
}
