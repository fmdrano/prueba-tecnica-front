import { HttpInterceptorFn , HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const skipToken = req.url.includes('token') ||
                    req.url.includes('login') ||
                    req.url.includes('logout') ||
                    req.url.includes('ws');

  // Saltar para login
  if (skipToken || !token) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(cloned);
};

