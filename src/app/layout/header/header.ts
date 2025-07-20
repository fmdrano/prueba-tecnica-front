import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Auth } from '../../shared/service/auth/auth';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  isDropdownOpen = false;
  isMobileMenuOpen = false;
  showLogoutButton = false;
  isAuthenticated = false;
  currentUser: any = null;
  isLoggingOut = false;

  private routerSubscription: Subscription | undefined;
  private authSubscription: Subscription | undefined;

  // Rutas donde se debe mostrar el botón
  private readonly LOGOUT_ROUTES  = ['admin'];

  toggleDropdown(event: Event): void {
    event.preventDefault();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Cerrar dropdown al hacer clic fuera
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
  const target = event.target as HTMLElement;
  const clickedInside = target.closest('.dropdown');
  if (!clickedInside) {
    this.closeDropdown();
  }
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    // Verificar estado de autenticación inicial
    this.checkAuthStatus();

    // Verificar la ruta inicial al cargar el componente
    this.checkCurrentRoute();

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.isAuthenticated$
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        this.currentUser = this.authService.getUserData();

        // Si no está autenticado, ocultar el botón
        if (!isAuth) {
          this.showLogoutButton = false;
        } else {
          // Verificar ruta actual si está autenticado
          this.checkCurrentRoute();
        }
      });

    // Suscribirse a los cambios de navegación
    this.routerSubscription = this.router.events
      .pipe(
        // Filtrar solo eventos de NavigationEnd (cuando la navegación termina)
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        console.log('Navegación completada a:', event.url);
        this.checkCurrentRoute();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Verifica el estado de autenticación actual
   */
  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUser = this.authService.getUserData();
  }

  /**
   * Verifica si la ruta actual debe mostrar el botón especial
   */
  private checkCurrentRoute(): void {
    const currentUrl = this.router.url;
    console.log('Verificando ruta para logout:', currentUrl);

    // Solo mostrar si está autenticado Y en una ruta específica
    this.showLogoutButton = this.isAuthenticated &&
      this.LOGOUT_ROUTES.some(route => this.isRouteMatch(currentUrl, route));

    console.log('Mostrar botón logout:', this.showLogoutButton);
  }

  /**
   * Verifica si una ruta específica coincide con la URL actual
   * @param url URL actual
   * @param targetRoute Ruta objetivo a verificar
   * @returns true si hay coincidencia
   */
  private isRouteMatch(url: string, targetRoute: string): boolean {
    // Opción 1: Verificación simple (contiene la palabra)
    return url.includes(targetRoute);

    // Opción 2: Verificación más estricta con regex
    // const pattern = new RegExp(`/${targetRoute}(/|$)`);
    // return pattern.test(url);
  }

  onLogoutClick(): void {
    // Prevenir múltiples clics
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;

    // Mostrar confirmación opcional
    const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');

    if (confirmLogout) {
      console.log('Cerrando sesión desde:', this.router.url);

      // Ejecutar logout
      this.authService.logout();

      // Opcional: Mostrar mensaje de éxito
      // this.showSuccessMessage('Sesión cerrada exitosamente');

    } else {
      this.isLoggingOut = false;
    }
  }

  getLogoutButtonText(): string {
    const currentUrl = this.router.url;

    if (currentUrl.includes('admin')) {
      return 'Salir de Admin';
    } else if (currentUrl.includes('verificacion')) {
      return 'Cerrar Verificación';
    }

    return 'Cerrar Sesión';
  }

  /**
   * Obtiene información detallada de la ruta actual usando ActivatedRoute
   */
  private getRouteInfo(): void {
    let route = this.activatedRoute;

    // Navegar hasta la ruta raíz
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Obtener parámetros de la ruta
    route.params.subscribe(params => {
      console.log('Parámetros de ruta:', params);
    });

    // Obtener datos de la ruta
    route.data.subscribe(data => {
      console.log('Datos de ruta:', data);
    });

    // Obtener query parameters
    route.queryParams.subscribe(queryParams => {
      console.log('Query parameters:', queryParams);
    });
  }

  /**
   * Método que se ejecuta cuando se hace clic en el botón especial
   */
  onSpecialButtonClick(): void {
    console.log('Botón especial clickeado en ruta:', this.router.url);

    // Aquí puedes agregar la lógica específica para cada ruta
    const currentUrl = this.router.url;

    if (currentUrl.includes('admin')) {
      this.handleAdminButtonClick();
    } else if (currentUrl.includes('verificacion')) {
      this.handleVerificacionButtonClick();
    }
  }

  /**
   * Lógica específica para el botón en rutas de admin
   */
  private handleAdminButtonClick(): void {
    console.log('Ejecutando acción específica para admin');
    // Lógica específica para admin
  }

  /**
   * Lógica específica para el botón en rutas de verificación
   */
  private handleVerificacionButtonClick(): void {
    console.log('Ejecutando acción específica para verificación');
    // Lógica específica para verificación
  }

  /**
   * Método helper para verificar si estamos en una ruta específica
   */
  isInRoute(routeName: string): boolean {
    return this.router.url.includes(routeName);
  }
}
