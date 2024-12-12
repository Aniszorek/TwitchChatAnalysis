import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from './auth.service';
import {catchError, map} from 'rxjs';


export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  const idToken = authService.getIdToken();
  if (idToken) {
    console.log('Validating token');

    return authService.validateToken(idToken).pipe(
      map(() => {
        console.log('Token is valid. Allowing navigation.');
        authService.isLoggedIn.set(true);
        return true;
      }),
      catchError(() => {
        console.log('Token validation failed. Redirecting to /login.');
        authService.logout();
        return router.navigate(['/login']);
      })
    );
  }

  console.log('No token found. Redirecting to /login.');
  return router.navigate(['/login']);
};
