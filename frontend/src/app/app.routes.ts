import {Routes} from '@angular/router';
import {AuthCallbackComponent} from './auth/auth-callback/auth-callback.component';
import {LoginComponent} from './auth/login/login.component';
import {StreamComponent} from './features/stream/stream.component';
import {authGuard} from "./auth/auth.guard";
import {SearchUserComponent} from './features/search-user/search-user.component';
import {ChartsComponent} from './features/charts/charts.component';
import {authTwitchGuard} from './auth/auth.twitch.guard';
import {StreamDataResolver} from './features/charts/stream-data.resolver';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'auth-callback',
    component: AuthCallbackComponent
  },
  {
    path: 'stream-search',
    component: SearchUserComponent,
    canActivate: [authGuard]
  },
  {
    path: 'stream',
    component: StreamComponent,
    canActivate: [authTwitchGuard]
  },
  {
    path: 'charts',
    component: ChartsComponent,
    canActivate: [authTwitchGuard],
    resolve: {streamData: StreamDataResolver}
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
