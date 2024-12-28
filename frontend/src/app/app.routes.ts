import {Routes} from '@angular/router';
import {AuthCallbackComponent} from './auth/auth-callback/auth-callback.component';
import {LoginComponent} from './auth/login/login.component';
import {StreamComponent} from './features/stream/stream.component';
import {authGuard} from "./auth/auth.guard";
import {SearchUserComponent} from './features/search-user/search-user.component';
import {ChartsComponent} from './features/charts/charts.component';
import {authTwitchGuard} from './auth/auth.twitch.guard';
import {StreamDataResolver} from './features/charts/stream-data.resolver';
import {ModeratorsComponent} from './features/stream/managment/moderators/moderators.component';
import {SuspendedComponent} from './features/stream/managment/suspended/suspended.component';
import {StreamSettingsComponent} from './features/stream/managment/stream-settings/stream-settings.component';
import {AutoModComponent} from './features/stream/managment/auto-mod/auto-mod.component';
import {BlockedTermsComponent} from './features/stream/managment/blocked-terms/blocked-terms.component';
import {RaidPollComponent} from './features/stream/managment/raid-poll/raid-poll.component';
import {ManagementComponent} from './features/stream/managment/management.component';
import {ProfileComponent} from './features/profile/profile.component';
import {MessageHistoryComponent} from './features/stream/managment/message-history/message-history.component';
import {streamSearchGuard} from './auth/stream-search.guard';

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
    canActivate: [authGuard, streamSearchGuard]
  },
  {
    path: 'stream',
    component: StreamComponent,
    canActivate: [authGuard, authTwitchGuard, streamSearchGuard],
    children: [
      {
        path: '',
        component: ManagementComponent,
        children: [
          {path: 'suspended', component: SuspendedComponent},
          {path: 'moderators', component: ModeratorsComponent},
          {path: 'stream-settings', component: StreamSettingsComponent},
          {path: 'auto-mod', component: AutoModComponent},
          {path: 'blocked-terms', component: BlockedTermsComponent},
          {path: 'raid-poll', component: RaidPollComponent},
          {path: 'message-history', component: MessageHistoryComponent},
          {path: '', redirectTo: 'suspended', pathMatch: 'full'}
        ]
      }
    ]
  },
  {
    path: 'charts',
    component: ChartsComponent,
    canActivate: [authGuard, authTwitchGuard],
    resolve: {streamData: StreamDataResolver}
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
