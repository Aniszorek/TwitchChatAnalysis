import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class streamSearchGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('twitchOauth');
    if (token) {
      return true;
    } else {
      this.router.navigate(['/profile']);
      return false;
    }
  }
}
