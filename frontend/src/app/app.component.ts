import { Component, OnInit } from '@angular/core';
import { RouterOutlet} from '@angular/router';
import { AuthService } from './auth/auth.service';
import { LoadingService } from './shared/loading.service';
import { Observable } from 'rxjs';
import {HeaderComponent} from './header/header.component';
import {AsyncPipe, NgIf} from '@angular/common';
import {ErrorMessageComponent} from './error-message/error-message.component';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {registerIcons} from './shared/icon-registry';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    HeaderComponent,
    RouterOutlet,
    AsyncPipe,
    NgIf,
    ErrorMessageComponent
  ],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoading$: Observable<boolean>;

  constructor(
    private readonly authService: AuthService,
    private readonly loadingService: LoadingService,
    private readonly matIconRegistry: MatIconRegistry,
    private readonly domSanitizer: DomSanitizer
  ) {
    this.isLoading$ = this.loadingService.loading$;
    this.loadingService.setLoading('auth', true);

    registerIcons(this.matIconRegistry, this.domSanitizer);
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
