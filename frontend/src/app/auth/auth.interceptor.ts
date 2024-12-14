import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from "@angular/core";
import {AuthService} from "./auth.service";

// Attaches cognito ID token and Twitch Ouath token to each request (if token is present)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const authTokens = authService.getStoredTokens();
    const twitchOauthToken = authService.getOauthToken();

    let newReq = req.clone()
    if (authTokens?.idToken) {
        newReq = req.clone({
            headers: req.headers.append('x-cognito-id-token', authTokens.idToken)
        });
    }

    if (twitchOauthToken) {
      newReq = req.clone({
        headers: req.headers.append('x-twitch-oauth-token', twitchOauthToken)
      })
    }

    console.log(newReq.url);
    return next(req);
};
