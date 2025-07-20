import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class NavigationControl {
  private router = inject(Router);
  private authService = inject(Auth);

  constructor() {
    this.setupBackButtonControl();
  }

  private setupBackButtonControl(): void {
    // Escuchar el evento popstate (botón atrás del navegador)
    window.addEventListener('popstate', (event) => {
      console.log('Botón atrás detectado');
      this.handleBackNavigation();
    });
  }

  private handleBackNavigation(): void {
    const currentUrl = this.router.url;
    const protectedRoutes = ['/admin', '/verificacion'];

    // Verificar si estamos en una ruta protegida
    const isInProtectedRoute = protectedRoutes.some(route =>
      currentUrl.includes(route)
    );

    if (isInProtectedRoute && !this.authService.isAuthenticated()) {
      console.log('⚠️ Intento de acceso a ruta protegida sin autenticación');

      // Prevenir la navegación hacia atrás
      window.history.pushState(null, '', window.location.href);

      // Redirigir al login
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Configura la página actual para prevenir navegación hacia atrás
   */
  public preventBackNavigation(): () => void {
    // Agregar estado al historial para capturar navegación hacia atrás
    window.history.pushState(null, '', window.location.href);

    // Configurar listener específico para esta página
    const handlePopState = () => {
      if (!this.authService.isAuthenticated()) {
        console.log('Navegación hacia atrás bloqueada - sin autenticación');
        this.router.navigate(['/auth/login']);
      } else {
        // Mantener en la página actual
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup cuando se destruya el componente
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }
}
