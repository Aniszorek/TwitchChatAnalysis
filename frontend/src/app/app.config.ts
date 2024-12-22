import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};

export const urls = {
  backendUrl: 'http://localhost:3000',
  cognitoLogoutUrl: 'https://twitchchatanalytics.auth.eu-central-1.amazoncognito.com/logout',
  cognitoLougoutRedirectUrl: 'http://localhost:4200/login',
  twitchOauthGenerate: "https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=y3s6y3r4sxt83e3qc53jz5uqmun47g&redirect_uri=http%3A%2F%2Flocalhost%3A4200%2Fprofile&scope=user%3Abot%20user%3Aread%3Achat%20user%3Awrite%3Achat%20channel%3Aread%3Asubscriptions%20moderator%3Aread%3Afollowers%20user%3Aread%3Amoderated_channels%20moderation%3Aread%20channel%3Amanage%3Amoderators%20moderator%3Amanage%3Abanned_users%20moderator%3Amanage%3Achat_messages%20moderator%3Amanage%3Aautomod_settings%20moderator%3Aread%3Aautomod_settings%20moderator%3Amanage%3Ablocked_terms%20moderator%3Aread%3Ablocked_terms%20channel%3Aread%3Avips%20channel%3Amanage%3Avips%20user%3Aedit%3Abroadcast%20channel%3Amanage%3Abroadcast%20channel_editor%20channel%3Amanage%3Apolls%20channel%3Amanage%3Araids%20moderator%3Amanage%3Achat_settings%20channel%3Amoderate",
}

export const config = {
  cognitoClientId: '58efohuhjeprodco2fd27ai9pt'
}
