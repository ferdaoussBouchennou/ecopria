import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AssociationService } from '../services/association.service';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  actions: any[];
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
  }

  loadActions(): void {
    this.loading = true;
    this.error = '';

    this.associationService.getMesActions().subscribe({
      next: (actions) => {
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
}
