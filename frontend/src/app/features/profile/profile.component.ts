import {Component, inject, OnInit} from '@angular/core';
import {urls} from '../../app.config';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../auth/auth.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  standalone: true,
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  router = inject(Router)
  route = inject(ActivatedRoute)
  authService = inject(AuthService);

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
  }


  generateToken() {
    window.location.replace(urls.twitchOauthGenerate);
  }
}
