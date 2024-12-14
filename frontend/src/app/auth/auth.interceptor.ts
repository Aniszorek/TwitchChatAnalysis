import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from "@angular/core";
import {AuthService} from "./auth.service";

// Attaches cognito ID token to each request (if token is present)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const authTokens = authService.getStoredTokens();

    if (authTokens?.idToken) {
        const newReq = req.clone({
            headers: req.headers.append('authorization', `Bearer ${authTokens.idToken}`)
        });
        console.log(newReq.url);
        return next(newReq);
    }

    return next(req);
};
