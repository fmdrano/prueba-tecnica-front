import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  private readonly LAST_ACTIVITY = 'last_activity';
  private readonly TIMEOUT = 30 * 60 * 1000; // 30 minutos en milisegundos

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  public loginStatusSubject = new Subject<boolean>();
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn2 = this.loggedIn.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkInitialAuthState();
    this.cleanCorruptedData();
  }

  private checkInitialAuthState(): void {
    const isAuth = this.hasToken();
    this.isAuthenticatedSubject.next(isAuth);
    this.loggedIn.next(isAuth);
  }

  /**
   * Verifica si existe un token en localStorage
   */
  private hasToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token && token !== '' && token !== 'null' && token !== 'undefined';
  }

  //generamos el token
  generateToken(loginData: any) {
    return this.http.post(`${environment.apiUrl}/api/auth/token`, loginData).pipe(
      tap((response: any) => {
        if (response.token) {
          this.loginUser(response.token);
          this.getCurrentUser().subscribe(
            (user: any) => {
              this.setUser(user);
              this.loginStatusSubject.next(true);
            }
          );
        }
      }),
      catchError(this.handleError)
    );
  }

  private cleanCorruptedData(): void {
  try {
    // Verificar y limpiar token corrupto
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && (token.includes('SELECT') || token.includes('DROP') || token.includes('CREATE'))) {
      console.warn('⚠️ Token corrupto detectado, limpiando...');
      localStorage.removeItem(this.TOKEN_KEY);
    }

    // Verificar y limpiar usuario corrupto
    const user = localStorage.getItem(this.USER_KEY);
    if (user && (user.includes('SELECT') || user.includes('DROP') || user.includes('CREATE'))) {
      console.warn('⚠️ Usuario corrupto detectado, limpiando...');
      localStorage.removeItem(this.USER_KEY);
    }
  } catch (error) {
    console.error('Error al limpiar datos corruptos:', error);
  }
  }

  public loginUser(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    // Actualizar estado de autenticación
    this.isAuthenticatedSubject.next(true);
    this.loggedIn.next(true);
    return true;
  }

  //metodo para comprobar si está conectado
  public isLoggedIn() {
    let tokenStr = localStorage.getItem(this.TOKEN_KEY);
    if (tokenStr == undefined || tokenStr == '' || tokenStr == null) {
      return false;
    } else {
      return true;
    }
  }

  //obtenemos el token
  public getToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('Obteniendo token del localStorage:', token);
    return token;
  }

  public setUser(user: any) {
    try {
      // Si es string, lo dejamos así, si es objeto lo convertimos a string
      const userStr = typeof user === 'string' ? user : JSON.stringify(user);
      localStorage.setItem(this.USER_KEY, userStr);
    } catch (e) {
      console.error('Error al guardar usuario:', e);
    }
  }

  public getUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return typeof userStr === 'object' ? userStr : JSON.parse(userStr);
      } catch (e) {
        console.error('Error al obtener usuario:', e);
        this.logout();
        return null;
      }
    }
    return null;
  }

  public logout(): void {
    try {
      console.log('Ejecutando logout...');

      // Limpiar localStorage
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem(this.LAST_ACTIVITY);

      // Actualizar todos los BehaviorSubjects
      this.isAuthenticatedSubject.next(false);
      this.loggedIn.next(false);
      this.loginStatusSubject.next(false);

      console.log('Estado después del logout - isAuthenticated:', false);

      // Redirigir al login
      this.router.navigate(['/auth/login']);

    } catch (error) {
      console.error('Error durante logout:', error);
    }
  }

  public getUserData(): any {
    return this.getUser();
  }

  public isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  public getUserRole() {
    const user = this.getUser();
    if (user && user.authorities && Array.isArray(user.authorities)) {
      return user.authorities[0];
    }
    return null;
  }

  public getCurrentUser() {
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (!token) {
      console.error('No hay token disponible');
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    return this.http.get(`${environment.apiUrl}/api/auth/actual-usuario`, { headers });
  }

  //private loggedIn = new BehaviorSubject<boolean>(false);

  //isLoggedIn2 = this.loggedIn.asObservable();

  login1() {
    this.loggedIn.next(true);
  }

  logout2() {
    this.loggedIn.next(false);
    localStorage.clear();
  }
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}
