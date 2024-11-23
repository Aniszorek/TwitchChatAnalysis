import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
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
