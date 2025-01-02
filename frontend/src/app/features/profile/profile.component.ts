import {Component, inject, OnInit} from '@angular/core';
import {urls} from '../../app.config';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthService} from '../../auth/auth.service';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {BackendService} from '../../shared/services/backend.service';
import {TwitchService} from '../twitch/twitch.service';
import {jwtDecode} from 'jwt-decode';

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    NgIf,
    RouterLink
  ],
  templateUrl: './profile.component.html',
  standalone: true,
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  router = inject(Router)
  route = inject(ActivatedRoute)
  authService = inject(AuthService);
  streamService = inject(BackendService);
  twitchService = inject(TwitchService);

  token: string | null = null;

  twitchProfileImageURL: string | null = null;
  twitchUsername: string | null = null;
  twitchUserId: string | null = null;

  cognitoUsername: string | null = null;
  cognitoEmail: string | null = null;

  showTwitchAccountDetails = false;
  savingToken = false;

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
    this.token = this.authService.getOauthToken();
    this.decodeJwt()
    this.saveToken();
  }

  generateToken() {
    window.location.replace(urls.twitchOauthGenerate);
  }

  saveToken() {
    if (this.token) {
      this.savingToken = true;
      this.showTwitchAccountDetails = false;
      this.authService.saveOuathToken(this.token!);
      this.twitchService.resetLoadingAndState()

      this.streamService.getTwitchUserInfo().subscribe({
          next: response => {
            this.twitchProfileImageURL = response.data[0]['profile_image_url'];
            this.twitchUsername = response.data[0]['display_name'];
            this.twitchUserId = response.data[0]['id'];
            this.showTwitchAccountDetails = true;
            this.savingToken = false;
          },
          error: error => {
            this.authService.saveOuathToken('');
            this.token = null;
            this.savingToken = false
            this.showTwitchAccountDetails = false;
          }
        }
      );
    } else {
      this.authService.saveOuathToken("");
      this.showTwitchAccountDetails = false;
    }
  }

  decodeJwt() {
    try {
      const decodedToken: any = jwtDecode(this.authService.getIdToken()!);
      this.cognitoUsername = decodedToken?.['cognito:username'];
      this.cognitoEmail = decodedToken?.email;
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }

}
