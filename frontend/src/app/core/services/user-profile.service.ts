import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Profile } from '../models/user.model';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly profileSubject = new BehaviorSubject<Profile | null>(null);

  readonly profile$: Observable<Profile | null> = this.profileSubject.asObservable();

  constructor(
    private readonly auth: AuthService,
    private readonly userService: UserService
  ) {}

  loadProfile(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.profileSubject.next(null);
      return;
    }

    this.userService.getProfile(userId).subscribe({
      next: (profile) => this.profileSubject.next(profile),
      error: () => this.profileSubject.next(null)
    });
  }

  setProfile(profile: Profile): void {
    this.profileSubject.next(profile);
  }

  get snapshot(): Profile | null {
    return this.profileSubject.value;
  }
}
