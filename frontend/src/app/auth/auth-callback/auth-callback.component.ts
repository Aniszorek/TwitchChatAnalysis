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
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => this.handleAuthCallback(params));
  }

  private handleAuthCallback(params: any): void {
    const successful = params.get('successful') === 'true';

    if (!successful) {
      console.error("Login failed");
      this.router.navigate(['/login']);
      return;
    }

    const idToken = params.get('idToken');
    const refreshToken = params.get('refreshToken');
    const expireTime = params.get('expireTime');

    if (idToken && refreshToken && expireTime) {
      this.authService.validateToken(idToken).subscribe({
        next: (response) => this.handleValidationResponse(response, idToken, refreshToken, expireTime),
        error: (err) => this.handleValidationError(err),
      });
    } else {
      console.error("Tokens or refresh time missing in callback");
      this.router.navigate(['/login']);
    }
  }

  private handleValidationResponse(response: {
    message: string
  }, idToken: string, refreshToken: string, expireTime: string): void {
    if (response.message === 'verified') {
      this.authService.saveTokens(idToken, refreshToken, expireTime);
      this.router.navigate(['/stream-search']);
    } else {
      console.error("Invalid token");
      this.router.navigate(['/login']);
    }
  }

  private handleValidationError(err: any): void {
    console.error("Token validation failed", err);
    this.router.navigate(['/login']);
  }
}
