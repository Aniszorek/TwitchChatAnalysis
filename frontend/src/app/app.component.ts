import { Component, OnInit } from '@angular/core';
import { RouterOutlet} from '@angular/router';
import { AuthService } from './auth/auth.service';
import { LoadingService } from './shared/loading.service';
import { Observable } from 'rxjs';
import {HeaderComponent} from './header/header.component';
import {AsyncPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    HeaderComponent,
    RouterOutlet,
    AsyncPipe,
    NgIf
  ],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoading$: Observable<boolean>;

  constructor(
    private readonly authService: AuthService,
    private readonly loadingService: LoadingService
  ) {
    this.isLoading$ = this.loadingService.loading$;
    this.loadingService.setLoading('auth', true);
  }

  ngOnInit(): void {
    this.authService.initializeSession();
    if (this.authService.isLoggedIn()) {
      this.authService.startTokenAutoRefresh();
    } else {
      this.authService.stopTokenAutoRefresh();
    }
  }
}
