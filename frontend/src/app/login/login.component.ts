import {Component, inject} from '@angular/core';
import {AuthService} from '../auth/auth.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  authService = inject(AuthService)

  initiateLogin() {
    this.authService.initiateLogin();
  }

}
