import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from "../auth.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  authService = inject(AuthService)
  route = inject(ActivatedRoute);
  router = inject(Router)

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const successful = params.get('successful') === 'true';

      if (successful) {
        const idToken = params.get('idToken');
        const refreshToken = params.get('refreshToken');
        const expireTime = params.get('expireTime')

        if (idToken && refreshToken && expireTime) {
          // Verify if the token is valid
          this.authService.validateToken(idToken).subscribe({
            next: (response) => {
              if (response.message === 'verified') {
                // Token is valid, save tokens and navigate
                this.authService.saveTokens(idToken, refreshToken, expireTime);
                this.authService.isLoggedIn.set(true);
                console.log("Token verified. Redirecting to /chat");
                this.router.navigate(['/chat']);
              } else {
                // Token verification failed
                console.error("Invalid token");
                this.router.navigate(['/login']);
              }
            },
            error: () => {
              console.error("Token validation failed");
              this.router.navigate(['/login']);
            }
          });
        } else {
          console.error("Tokens or refresh time missing in callback");
          this.router.navigate(['/login']);
        }
      } else {
        console.error("Login failed");
        this.router.navigate(['/login']);
      }
    });
  }

}
