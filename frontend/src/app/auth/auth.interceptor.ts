import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from "@angular/core";
import {AuthService} from "./auth.service";

// Attaches cognito ID token and Twitch Ouath token to each request (if token is present)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const authTokens = authService.getStoredTokens();
    const twitchOauthToken = authService.getOauthToken();

  let updatedHeaders = req.headers;

  if (authTokens?.idToken) {
    updatedHeaders = updatedHeaders.append('x-cognito-id-token', authTokens.idToken);
  }

  if (twitchOauthToken) {
    updatedHeaders = updatedHeaders.append('x-twitch-oauth-token', twitchOauthToken);
  }

  const newReq = req.clone({ headers: updatedHeaders });

    console.log(newReq.url);
    console.log(newReq.headers)
    return next(newReq);
};
