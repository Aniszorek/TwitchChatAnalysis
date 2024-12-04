import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './header/header.component';
import {AuthService} from './auth/auth.service';
import {LoginComponent} from './login/login.component';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, LoginComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  isLoading = true;
  constructor(private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.isLoading.subscribe((loading) => {
      this.isLoading = loading;
    });

    this.authService.initializeSession();
  }
}
