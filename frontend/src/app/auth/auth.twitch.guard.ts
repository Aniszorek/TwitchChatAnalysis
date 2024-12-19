import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {TwitchService} from '../features/twitch/twitch.service';

// todo dawać dostęp tylko jeśli ktoś jest przynajmniej moderatorem (do przemyślenia czy na /stream można wejść jako viewer, teraz niby tak, ale potem tam więcej opcji chyba będzie) -
export const authTwitchGuard: CanActivateFn = () => {
  const twitchService = inject(TwitchService);
  const router = inject(Router);

  if (twitchService['state'].broadcasterUsername.getValue() != null) {
    return true;
  }

  console.log("Twitch username is not defined. Redirecting to /stream-search");
  return router.navigate(['/stream-search']);
};

