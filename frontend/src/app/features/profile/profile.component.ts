import {Component, inject, OnInit} from '@angular/core';
import {urls} from '../../app.config';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../auth/auth.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule
  ],
  templateUrl: './profile.component.html',
  standalone: true,
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  router = inject(Router)
  route = inject(ActivatedRoute)
  authService = inject(AuthService);

  token: string | null = null;

  ngOnInit(): void {
    this.route.fragment.subscribe((fragment: string | null) => {
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');

        if (accessToken) {
          this.authService.saveOuathToken(accessToken);

          this.router.navigate([], {
            relativeTo: this.route,
            replaceUrl: true,
            queryParamsHandling: 'merge',
          });
        }
      }
    });
    this.token = this.authService.getOauthToken()
  }

  generateToken() {
    window.location.replace(urls.twitchOauthGenerate);
  }

  saveToken() {
    if (this.token) {
      this.authService.saveOuathToken(this.token);
    }

  }

}
