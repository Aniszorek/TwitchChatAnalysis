import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './header/header.component';
import {AuthService} from './auth/auth.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  isLoading = true;


  constructor(private readonly authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.isLoading.subscribe((loading) => {
      this.isLoading = loading;
    });

    this.authService.initializeSession();


    if (this.authService.isLoggedIn()) {
      this.authService.startTokenAutoRefresh();
    } else {
      this.authService.stopTokenAutoRefresh();
    }
  }
}
