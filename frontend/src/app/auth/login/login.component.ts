import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../auth.service';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService)
  private router = inject(Router);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      if (this.authService.getOauthToken()){
        this.router.navigate(['/stream-search']);
      } else{
        this.router.navigate(['/profile']);
      }
    }
  }

  initiateLogin() {
    this.authService.initiateLogin();
  }

}
