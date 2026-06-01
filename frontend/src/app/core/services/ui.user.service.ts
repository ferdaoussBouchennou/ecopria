import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private readonly _pageTitle = new BehaviorSubject<string>('');
  private readonly _pageEyebrow = new BehaviorSubject<string>('');

  public currentTitle$ = this._pageTitle.asObservable();
  public currentEyebrow$ = this._pageEyebrow.asObservable();

  setPageHeader(title: string, eyebrow: string): void {
    this._pageTitle.next(title);
    this._pageEyebrow.next(eyebrow);
  }
}
