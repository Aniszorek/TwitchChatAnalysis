import {Component} from '@angular/core';
import {AuthService} from '../auth/auth.service';
import {Router, RouterLink} from '@angular/router';
import {NgClass, NgIf} from '@angular/common';
import {TwitchService} from '../features/twitch/twitch.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  activeView: string = '';

  constructor(private readonly router: Router, public readonly authService: AuthService, public readonly twitchService: TwitchService) {
    this.activeView = this.router.url.includes('charts') ? 'charts' : 'stream';
  }

  login() {
    this.authService.initiateLogin()
  }

  logout() {
    this.activeView = 'stream';
    this.authService.logout();
  }

  goToCharts() {
    this.activeView = 'charts';
    this.router.navigate(['/charts']);
  }

  goToStream() {
    this.activeView = 'stream';
    this.router.navigate(['/stream']);
  }
}
