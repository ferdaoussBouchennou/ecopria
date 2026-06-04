import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssociationUiService {
  private readonly toastSubject = new BehaviorSubject<ToastState | null>(null);
  readonly toast$ = this.toastSubject.asObservable();

  private confirmOpen = false;
  private confirmState: ConfirmOptions | null = null;
  private confirmResult = new Subject<boolean>();

  private promptOpen = false;
  private promptState: PromptOptions | null = null;
  private promptValue = '';
  private promptResult = new Subject<string | null>();

  get isConfirmOpen(): boolean {
    return this.confirmOpen;
  }

  get isPromptOpen(): boolean {
    return this.promptOpen;
  }

  get activeConfirm(): ConfirmOptions | null {
    return this.confirmState;
  }

  get activePrompt(): PromptOptions | null {
    return this.promptState;
  }

  get promptInputValue(): string {
    return this.promptValue;
  }

  toast(message: string, type: ToastType = 'info'): void {
    this.toastSubject.next({ message, type });
    setTimeout(() => {
      if (this.toastSubject.value?.message === message) {
        this.toastSubject.next(null);
      }
    }, 5000);
  }

  dismissToast(): void {
    this.toastSubject.next(null);
  }

  confirm(options: ConfirmOptions): Observable<boolean> {
    this.confirmState = options;
    this.confirmOpen = true;
    return this.confirmResult.asObservable().pipe(take(1));
  }

  resolveConfirm(confirmed: boolean): void {
    this.confirmOpen = false;
    this.confirmState = null;
    this.confirmResult.next(confirmed);
    this.confirmResult.complete();
    this.confirmResult = new Subject<boolean>();
  }

  prompt(options: PromptOptions): Observable<string | null> {
    this.promptState = options;
    this.promptValue = '';
    this.promptOpen = true;
    return this.promptResult.asObservable().pipe(take(1));
  }

  setPromptValue(value: string): void {
    this.promptValue = value;
  }

  resolvePrompt(value: string | null): void {
    if (value !== null && this.promptState?.required && !value.trim()) {
      this.toast('Ce champ est obligatoire.', 'error');
      return;
    }
    this.promptOpen = false;
    this.promptState = null;
    this.promptValue = '';
    this.promptResult.next(value);
    this.promptResult.complete();
    this.promptResult = new Subject<string | null>();
  }
}
