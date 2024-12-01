import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from "@angular/core";
import {AuthService} from "./auth.service";

// Attaches cognito ID token to each request (if token is present)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authTokens = inject(AuthService).getAuthTokens();
    if (authTokens.idToken) {
        const newReq = req.clone({
            headers: req.headers.append('x-cognito-id-token', authTokens.idToken,)
        });
        console.log(newReq.url)
        return next(newReq);
    }
    return next(req)
};
