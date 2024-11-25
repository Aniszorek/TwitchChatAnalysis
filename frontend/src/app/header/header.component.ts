import {Component, inject} from '@angular/core';
import {AuthService} from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  authService = inject(AuthService);

  login() {
    this.authService.initiateLogin()
  }

  logout() {
    this.authService.logout();
  }
}
