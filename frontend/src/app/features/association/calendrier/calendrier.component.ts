import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AssociationService } from '../services/association.service';
import { ActionSummary } from '../../action/models/action.model';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  actions: ActionSummary[];
}

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendrier.component.html',
  styleUrl: './calendrier.component.scss'
})
export class CalendrierComponent implements OnInit {
  currentDate: Date = new Date();
  currentMonthLabel: string = '';
  calendarDays: CalendarDay[] = [];
  actions: ActionSummary[] = [];
  selectedDay: CalendarDay | null = null;
  loading: boolean = false;
  error: string = '';

  constructor(
    private associationService: AssociationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.generateCalendar();
    this.loadActions();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Format month label
    this.currentMonthLabel = this.currentDate.toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
    this.currentMonthLabel = this.currentMonthLabel.charAt(0).toUpperCase() + this.currentMonthLabel.slice(1);

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    let startDay = firstDay.getDay();
    // Convert to Monday = 0
    startDay = startDay === 0 ? 6 : startDay - 1;

    // Calculate days to show from previous month
    const prevMonthDays = startDay;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Calculate days to show from next month
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((prevMonthDays + totalDays) / 7) * 7;
    const nextMonthDays = totalCells - prevMonthDays - totalDays;

    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      this.calendarDays.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        actions: []
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      this.calendarDays.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        actions: []
      });
    }

    // Next month days
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(year, month + 1, day);
      this.calendarDays.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        actions: []
      });
    }

    this.selectedDay = this.calendarDays.find((day) => day.isToday && day.isCurrentMonth) ?? this.calendarDays[0] ?? null;
  }

  loadActions(): void {
    this.loading = true;
    this.error = '';

    this.associationService.getMesActions().pipe(
      catchError((err) => {
        console.error('Erreur lors du chargement des actions (calendrier):', err);
        return of([] as ActionSummary[]);
      })
    ).subscribe({
      next: (actions) => {
        this.actions = actions;

        this.calendarDays.forEach((day) => {
          day.actions = [];
        });

        // Distribute actions to calendar days
        actions.forEach(action => {
          const actionDate = new Date(action.dateStart);
          actionDate.setHours(0, 0, 0, 0);

          const calendarDay = this.calendarDays.find(day => {
            const dayTime = new Date(day.date);
            dayTime.setHours(0, 0, 0, 0);
            return dayTime.getTime() === actionDate.getTime();
          });

          if (calendarDay) {
            calendarDay.actions.push(action);
          }
        });

        this.calendarDays.forEach((day) => {
          day.actions.sort(
            (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
          );
        });

        if (this.selectedDay) {
          const selected = this.calendarDays.find((day) => this.isSameDay(day.date, this.selectedDay!.date));
          this.selectedDay = selected ?? this.calendarDays[0] ?? null;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actions:', err);
        this.error = 'Impossible de charger les actions.';
        this.loading = false;
      }
    });
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
    this.loadActions();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
    this.loadActions();
  }

  viewAction(actionId: number): void {
    this.router.navigate(['/association/action', actionId]);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
    this.loadActions();
  }

  getMonthActionsCount(): number {
    return this.monthActions.length;
  }

  getMonthPublishedCount(): number {
    return this.monthActions.filter((action) => action.status === 'PUBLISHED').length;
  }

  getMonthDraftCount(): number {
    return this.monthActions.filter((action) => action.status === 'DRAFT').length;
  }

  getMonthParticipantCount(): number {
    return this.monthActions.reduce((sum, action) => sum + (action.registeredCount ?? 0), 0);
  }

  getDayLabel(day: CalendarDay | null): string {
    if (!day) {
      return 'Aucune date sélectionnée';
    }
    return day.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  getDayStatusLabel(action: ActionSummary): string {
    if (action.status === 'DRAFT') {
      return 'Brouillon';
    }
    if (action.status === 'CANCELLED') {
      return 'Annulée';
    }
    if (new Date(action.dateEnd).getTime() < Date.now()) {
      return 'Terminée';
    }
    return 'Publiée';
  }

  getDayStatusClass(action: ActionSummary): string {
    if (action.status === 'DRAFT') {
      return 'draft';
    }
    if (action.status === 'CANCELLED') {
      return 'cancelled';
    }
    if (new Date(action.dateEnd).getTime() < Date.now()) {
      return 'completed';
    }
    return 'published';
  }

  formatHourRange(action: ActionSummary): string {
    const start = new Date(action.dateStart).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const end = new Date(action.dateEnd).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${start} - ${end}`;
  }

  private get monthActions(): ActionSummary[] {
    const month = this.currentDate.getMonth();
    const year = this.currentDate.getFullYear();
    return this.actions.filter((action) => {
      const date = new Date(action.dateStart);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }
}
