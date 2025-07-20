import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, fromEvent, merge, Subject, Subscription, switchMap, tap, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Inactivity {
  private inactivityTimer$: Subject<void> = new Subject();
  private timerSubscription?: Subscription;
  private readonly INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos por defecto
  private readonly WARNING_TIME = 5 * 60 * 1000; // Advertencia 5 minutos antes

  // Eventos que consideramos como actividad
  private activityEvents = [
    'mousedown', 'mousemove', 'keypress', 'scroll',
    'touchstart', 'click', 'wheel'
  ];

  // Subjects para notificar eventos
  public onWarning$ = new Subject<number>(); // Emite tiempo restante
  public onTimeout$ = new Subject<void>();   // Emite cuando se agota el tiempo
  public onUserActive$ = new Subject<void>(); // Emite cuando el usuario está activo

  constructor(
    private ngZone: NgZone,
    private router: Router
  ) {}

  /**
   * Inicializa el servicio de inactividad
   * @param inactivityMinutes - Minutos de inactividad antes de limpiar
   * @param warningMinutes - Minutos antes del timeout para mostrar advertencia
   */
  startMonitoring(inactivityMinutes: number = 30, warningMinutes: number = 5): void {
    const inactivityTime = inactivityMinutes * 60 * 1000;
    const warningTime = warningMinutes * 60 * 1000;

    this.stopMonitoring(); // Detener cualquier monitoreo previo

    // Crear observables de eventos de actividad
    const activityStreams = this.activityEvents.map(event =>
      fromEvent(document, event)
    );

    // Combinar todos los eventos de actividad
    const userActivity$ = merge(...activityStreams);

    this.ngZone.runOutsideAngular(() => {
      this.timerSubscription = userActivity$.pipe(
        debounceTime(1000), // Esperar 1 segundo después de la última actividad
        tap(() => {
          console.log('Actividad detectada - reiniciando timer');
          this.ngZone.run(() => this.onUserActive$.next());
        }),
        switchMap(() => {
          // Iniciar timer de advertencia
          const warningTimer$ = timer(inactivityTime - warningTime).pipe(
            tap(() => {
              console.log('Mostrando advertencia de inactividad');
              this.ngZone.run(() => this.onWarning$.next(warningTime / 1000));
            })
          );

          // Timer final de timeout
          const timeoutTimer$ = timer(inactivityTime).pipe(
            tap(() => {
              console.log('Tiempo de inactividad agotado');
              this.ngZone.run(() => {
                this.clearStorageAndRedirect();
                this.onTimeout$.next();
              });
            })
          );

          return merge(warningTimer$, timeoutTimer$);
        })
      ).subscribe();
    });

    // Activar el timer inmediatamente
    this.resetTimer();
  }

  /**
   * Detiene el monitoreo de inactividad
   */
  stopMonitoring(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  /**
   * Reinicia el timer manualmente
   */
  resetTimer(): void {
    // Simular actividad para reiniciar el timer
    document.dispatchEvent(new Event('mousedown'));
  }

  /**
   * Limpia el localStorage y redirige
   */
  private clearStorageAndRedirect(): void {
    try {
      // Opción 1: Limpiar todo el localStorage
      localStorage.clear();

      // Opción 2: Limpiar solo claves específicas
      // this.clearSpecificKeys(['user', 'session', 'token']);

      // Opción 3: Limpiar excepto ciertas claves
      // this.clearExceptKeys(['theme', 'language']);

      console.log('LocalStorage limpiado por inactividad');

      // Redirigir al login o página principal
      this.router.navigate(['/auth/login']);

    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }

  /**
   * Limpia claves específicas del localStorage
   */
  private clearSpecificKeys(keys: string[]): void {
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error al eliminar la clave ${key}:`, error);
      }
    });
  }

  /**
   * Limpia todo el localStorage excepto las claves especificadas
   */
  private clearExceptKeys(keysToKeep: string[]): void {
    try {
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error al limpiar localStorage selectivo:', error);
    }
  }

  /**
   * Verifica si hay actividad reciente basada en timestamp
   */
  checkLastActivity(): boolean {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const now = Date.now();
    const lastTime = parseInt(lastActivity);
    const timeDiff = now - lastTime;

    return timeDiff < this.INACTIVITY_TIME;
  }

  /**
   * Guarda timestamp de última actividad
   */
  updateLastActivity(): void {
    try {
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch (error) {
      console.error('Error al actualizar última actividad:', error);
    }
  }

  /**
   * Limpia manualmente el storage
   */
  forceCleanup(): void {
    this.clearStorageAndRedirect();
  }

  /**
   * Obtiene el tiempo restante antes del timeout
   */
  getRemainingTime(): number {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return 0;

    const now = Date.now();
    const lastTime = parseInt(lastActivity);
    const elapsed = now - lastTime;
    const remaining = this.INACTIVITY_TIME - elapsed;

    return Math.max(0, Math.floor(remaining / 1000)); // Retorna segundos
  }
}
