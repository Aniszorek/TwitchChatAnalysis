import {Injectable} from '@angular/core';
import {Resolve} from '@angular/router';
import {Observable} from 'rxjs';
import {finalize, tap} from 'rxjs/operators';
import {StreamService} from './services/stream.service';
import {AuthService} from '../../auth/auth.service';
import {TwitchService} from '../twitch/twitch.service';
import {LoadingService} from '../../shared/loading.service';

@Injectable({
  providedIn: 'root',
})
export class StreamDataResolver implements Resolve<any> {
  constructor(
    private readonly streamService: StreamService,
    private readonly authService: AuthService,
    private readonly twitchService: TwitchService,
    private readonly loadingService: LoadingService
  ) {
  }

  resolve(): Observable<any> {
    const broadcasterUserLogin = this.twitchService.getTwitchUsername();
    const authorization = this.authService.getIdToken();

    if (!broadcasterUserLogin) {
      console.warn('broadcasterUserLogin is empty');
      return new Observable<any>((observer) => {
        observer.complete();
      });
    }

    this.loadingService.setLoading('streamData', true);

    return this.streamService.getStreams(broadcasterUserLogin, authorization).pipe(
      tap(() => console.log('Fetching stream data...')),
      finalize(() => this.loadingService.setLoading('streamData', false))
    );
  }
}
