import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from './auth.service';
import {catchError, from, map, of} from 'rxjs';


export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validateOrRefreshTokenObservable().pipe(
    map((isValid) => {
      if (isValid) {
        return true;
      } else {
        authService.logout();
        return router.createUrlTree(['/login']);
      }
    }),
    catchError(() => {
      authService.logout();
      return of(router.createUrlTree(['/login']));
    })
  );
};


