import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { NavigationControl } from '../../../../shared/service/auth/navigation-control';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Auth } from '../../../../shared/service/auth/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {

  private navigationControl = inject(NavigationControl);
  private cleanupBackNavigation?: () => void;

  mostrarBoton = false;

  // ✅ Nueva propiedad para controlar el loader
  isLoading = false;

  loginData = {
    "username": "",
    "password": ""
  };

  // private jwk = new JwtHelperService();
  showPassword: boolean = false;

  constructor(
    private snack: MatSnackBar,
    private loginService: Auth,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cleanupBackNavigation = this.navigationControl.preventBackNavigation();
    // NO mostrar loader al inicio
    this.isLoading = false;

    // Verificar si ya está logueado
    if (this.loginService.isLoggedIn()) {
      const role = this.loginService.getUserRole();
      this.redirectToRoleDashboard(role);
    }
  }

  ngOnDestroy(): void {
    // Limpiar event listeners
    if (this.cleanupBackNavigation) {
      this.cleanupBackNavigation();
    }
  }

  // Implementar interfaz para CanDeactivate
  canDeactivate(): boolean {
    return true; // O agregar lógica específica
  }

  // Método opcional para ocultar loader manualmente
  hideLoader(): void {
    this.isLoading = false;
  }

  // Método opcional para mostrar loader durante login
  showLoader(): void {
    this.isLoading = true;
  }

  formSubmit() {
    // Validaciones
    if (this.loginData.username.trim() == '' || this.loginData.username.trim() == null) {
      this.snack.open("El nombre de usuario es requerido", 'Aceptar', {
        duration: 5000
      });
      return;
    }

    if (this.loginData.password.trim() == '' || this.loginData.password.trim() == null) {
      this.snack.open("La contraseña es requerida", 'Aceptar', {
        duration: 5000
      });
      return;
    }

    // ✅ MOSTRAR LOADER al hacer clic en iniciar sesión
    this.showLoader();

    // Lógica de login
    this.loginService.generateToken(this.loginData).subscribe({
      next: (data: any) => {
        console.log('Respuesta de login:', data);

        if (!data.token) {
          console.error('No se recibió token en la respuesta');
          this.showErrorMessage('Error en el servidor - No se recibió token');
          this.hideLoader(); // ✅ Ocultar loader en caso de error
          return;
        }

        // Guardar el token
        const tokenSaved = this.loginService.loginUser(data.token);

        if (!tokenSaved) {
          console.error('Error al guardar el token');
          this.showErrorMessage('Error al guardar la sesión');
          this.hideLoader(); // ✅ Ocultar loader en caso de error
          return;
        }

        // Obtener usuario actual
        this.loginService.getCurrentUser().subscribe({
          next: (user: any) => {
            console.log('Usuario obtenido:', user);
            this.loginService.setUser(user);

            const role = this.loginService.getUserRole();
            console.log('Rol del usuario:', role);

            // Marcar como logueado
            this.loginService.loginStatusSubject.next(true);

            // ✅ Mantener loader por 1.5 segundos más para mostrar éxito
            setTimeout(() => {
              this.hideLoader();
              this.redirectToRoleDashboard(role);
            }, 1500);
          },
          error: (error) => {
            console.error('Error al obtener usuario:', error);
            this.showErrorMessage('Error al obtener información del usuario');
            this.hideLoader(); // ✅ Ocultar loader en caso de error
          }
        });
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.showErrorMessage('Verifica tu nombre de usuario y contraseña e intenta nuevamente');
        this.hideLoader(); // ✅ Ocultar loader en caso de error
      }
    });
  }

  // Método para centralizar redirecciones
  private redirectToRoleDashboard(role: string): void {
    const roleRoutes: { [key: string]: string } = {
      'ADMIN': 'home/admin',
      'NORMAL': 'home/verificador',
      'ROOT': 'home/admin',
      'GESTOR': 'home/admin',
    };

    const route = roleRoutes[role];
    if (route) {
      this.router.navigate([route]);
    } else {
      console.warn('Rol no reconocido:', role);
      this.router.navigate(['dashboard']); // Fallback
    }
  }

  // Método para centralizar mensajes de error
  private showErrorMessage(message: string): void {
    Swal.fire('Error', message, 'error');
  }

  signup() {
    this.router.navigate(['/signup']);
  }
}
