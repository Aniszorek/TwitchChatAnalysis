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

        if (idToken && refreshToken) {
          // Verify if token is valid using backend endpoint
          this.authService.validateToken(idToken).subscribe({
              next: (response) => {
                if (response.valid) {
                  this.authService.saveTokens(idToken, refreshToken);
                  this.authService.isLoggedIn.set(true);
                  this.router.navigate(['/chat']);
                } else {
                  this.router.navigate(['/login']);
                }
              },
              error: () => {
                this.router.navigate(['/login']);
              }
            }
          )

          // Save tokens and navigate to main app
          this.authService.saveTokens(idToken, refreshToken);
          console.log("Tokens saved. Redirecting to /chat");
          this.router.navigate(['/chat']);
        } else {
          console.error("Tokens missing in callback");
          this.router.navigate(['/login']);
        }
      } else {
        console.error("Login failed");
        this.router.navigate(['/login']);
      }
    })

  }
}
