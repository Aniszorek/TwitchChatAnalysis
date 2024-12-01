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
  cognitoLougoutRedirectUrl: 'http://localhost:4200/login'
}

export const config = {
  cognitoClientId: '58efohuhjeprodco2fd27ai9pt'
}
