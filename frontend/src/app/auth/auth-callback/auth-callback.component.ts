import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from "../auth.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit{
  authService = inject(AuthService)
  route = inject(ActivatedRoute);
  router = inject(Router)
  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.authService.isLoggedIn.set(params.get('successful') === 'true');
      console.log(this.authService.isLoggedIn());
      if (this.authService.isLoggedIn()){
        this.router.navigate(['/chat']);
      }
    })
  }
}
