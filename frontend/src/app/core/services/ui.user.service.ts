import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private titleSubject = new BehaviorSubject<string>('Tableau de bord');
  private eyebrowSubject = new BehaviorSubject<string>('VOTRE PRINTEMPS ENGAGÉ');
  
  currentTitle$ = this.titleSubject.asObservable();
  currentEyebrow$ = this.eyebrowSubject.asObservable();

  setPageHeader(title: string, eyebrow: string) {
    this.titleSubject.next(title);
    this.eyebrowSubject.next(eyebrow.toUpperCase());
  }

  // Legacy support
  setTitle(title: string) {
    this.titleSubject.next(title);
  }
}
