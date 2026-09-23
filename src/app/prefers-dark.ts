import { DestroyRef, inject, type Signal, signal } from '@angular/core';

/** Tracks the OS color scheme. Needs an injection context. */
export function injectPrefersDark(): Signal<boolean> {
  // not available outside browsers, e.g. in jsdom-based unit tests
  if (typeof matchMedia !== 'function') return signal(false);

  const mq = matchMedia('(prefers-color-scheme: dark)');
  const dark = signal(mq.matches);
  const onChange = (e: MediaQueryListEvent) => dark.set(e.matches);
  mq.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', onChange));
  return dark.asReadonly();
}
