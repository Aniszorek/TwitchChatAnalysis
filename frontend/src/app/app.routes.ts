import {Routes} from '@angular/router';
import {AuthCallbackComponent} from './auth/auth-callback/auth-callback.component';
import {LoginComponent} from './login/login.component';
import {ChatComponent} from './chat/chat.component';
import {authGuard} from "./auth/auth.guard";

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
        path: 'chat',
        component: ChatComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
