import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly loadingMap = new Map<string, boolean>();
  private readonly _loading = new BehaviorSubject<boolean>(false);
  public readonly loading$: Observable<boolean> = this._loading.asObservable();

  setLoading(key: string, isLoading: boolean): void {
    this.loadingMap.set(key, isLoading);
    this.updateGlobalLoadingState();
  }

  removeLoading(key: string): void {
    this.loadingMap.delete(key);
    this.updateGlobalLoadingState();
  }

  private updateGlobalLoadingState(): void {
    const isLoading = Array.from(this.loadingMap.values()).some((value) => value);
    this._loading.next(isLoading);
  }
}
