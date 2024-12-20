import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private messageSubject = new Subject<string>();

  sendMessage(message: string): void {
    this.messageSubject.next(message);
  }

  getMessages(): Observable<string> {
    return this.messageSubject.asObservable();
  }
}
