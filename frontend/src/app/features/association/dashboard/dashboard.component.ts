import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AssociationService } from '../services/association.service';
import { ActionSummary } from '../../action/models/action.model';

Chart.register(...registerables);

interface DashboardStats {
  inscritsCeMois: number;
  actionsPubliees: number;
  tauxRemplissage: number;
  inscritsCumules: number;
}

interface CategoryData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface TopAction {
  id: number;
  titre: string;
  city: string;
  inscrits: number;
  maxParticipants: number;
  fillPercentage: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('evolutionChart') evolutionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriesChart') categoriesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fillRateChart') fillRateChartRef!: ElementRef<HTMLCanvasElement>;

  loading: boolean = true;
  stats: DashboardStats = {
    inscritsCeMois: 0,
    actionsPubliees: 0,
    tauxRemplissage: 0,
    inscritsCumules: 0
  };

  categoriesData: CategoryData[] = [];
  topActions: TopAction[] = [];
  private actions: ActionSummary[] = [];

  private evolutionChart?: Chart;
  private categoriesChart?: Chart;
  private fillRateChart?: Chart;

  constructor(
    private associationService: AssociationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be created after data is loaded
  }

  loadDashboardData(): void {
    this.loading = true;

    this.associationService.getMesActions().subscribe({
      next: (actions) => {
        this.actions = actions;
        this.calculateStats(actions);
        this.calculateCategories(actions);
        this.calculateTopActions(actions);

        setTimeout(() => {
          this.createEvolutionChart();
          this.createCategoriesChart();
          this.createFillRateChart();
        }, 100);

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement dashboard:', err);
        this.loading = false;
      }
    });
  }

  calculateStats(actions: ActionSummary[]): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const publishedActions = actions.filter(a => a.status === 'PUBLISHED' && !a.isFixed);
    this.stats.actionsPubliees = publishedActions.length;

    this.stats.inscritsCeMois = publishedActions
      .filter(a => {
        const d = new Date(a.dateStart);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, a) => sum + (a.registeredCount ?? 0), 0);

    if (publishedActions.length > 0) {
      const totalFillRate = publishedActions.reduce((sum, action) => {
        const max = action.maxParticipants || 1;
        const fillRate = ((action.registeredCount ?? 0) / max) * 100;
        return sum + fillRate;
      }, 0);
      this.stats.tauxRemplissage = Math.round(totalFillRate / publishedActions.length);
    } else {
      this.stats.tauxRemplissage = 0;
    }

    this.stats.inscritsCumules = publishedActions.reduce(
      (sum, a) => sum + (a.registeredCount ?? 0),
      0
    );
  }

  calculateCategories(actions: ActionSummary[]): void {
    const categoryColors = [
      '#7FA99B', // Vert sage
      '#1C1917', // Noir
      '#D4A574', // Beige/marron
      '#6B7280', // Gris
      '#A8C5BC'  // Vert clair
    ];

    const categoryMap = new Map<string, number>();
    
    actions.forEach(action => {
      const catName = action.categoryName || 'Autre';
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
    });

    const total = actions.length;
    this.categoriesData = Array.from(categoryMap.entries())
      .map(([name, count], index) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
        color: categoryColors[index % categoryColors.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  calculateTopActions(actions: ActionSummary[]): void {
    this.topActions = actions
      .filter(a => a.status === 'PUBLISHED' && !a.isFixed)
      .map(action => {
        const inscrits = action.registeredCount ?? 0;
        const max = action.maxParticipants || 1;
        return {
          id: action.id,
          titre: action.title,
          city: action.city,
          inscrits,
          maxParticipants: action.maxParticipants,
          fillPercentage: Math.round((inscrits / max) * 100),
          imageUrl: action.categoryImageUrl
        };
      })
      .sort((a, b) => b.inscrits - a.inscrits)
      .slice(0, 5);
  }

  createEvolutionChart(): void {
    if (!this.evolutionChartRef) return;

    const ctx = this.evolutionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = this.buildMonthlyInscriptions(this.actions);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Inscriptions',
          data: data,
          borderColor: '#1C1917',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 6,
          pointBackgroundColor: '#1C1917',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1C1917',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#E7E5E4',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#F5F5F4'
            },
            ticks: {
              color: '#78716C',
              font: {
                size: 12
              }
            },
            border: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#78716C',
              font: {
                size: 12
              }
            },
            border: {
              display: false
            }
          }
        }
      }
    };

    this.evolutionChart = new Chart(ctx, config);
  }

  createCategoriesChart(): void {
    if (!this.categoriesChartRef) return;

    const ctx = this.categoriesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.categoriesData.map(c => c.name),
        datasets: [{
          data: this.categoriesData.map(c => c.count),
          backgroundColor: this.categoriesData.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1C1917',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff'
          }
        }
      } as any
    };

    this.categoriesChart = new Chart(ctx, config);
  }

  createFillRateChart(): void {
    if (!this.fillRateChartRef) return;

    const ctx = this.fillRateChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = this.buildMonthlyFillRates(this.actions);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Taux de remplissage (%)',
          data: data,
          backgroundColor: '#D9EDE5',
          borderColor: '#7FA99B',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: '#C5E0D8'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1C1917',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: (context) => `${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: '#F5F5F4'
            },
            ticks: {
              color: '#78716C',
              font: {
                size: 12
              },
              callback: (value) => `${value}%`
            },
            border: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#78716C',
              font: {
                size: 12
              }
            },
            border: {
              display: false
            }
          }
        }
      }
    };

    this.fillRateChart = new Chart(ctx, config);
  }

  viewAction(actionId: number): void {
    this.router.navigate(['/association/action', actionId]);
  }

  private buildMonthlyInscriptions(actions: ActionSummary[]): number[] {
    const buckets = new Array(12).fill(0);
    actions
      .filter(a => a.status === 'PUBLISHED' && !a.isFixed)
      .forEach(a => {
        const d = new Date(a.dateStart);
        buckets[d.getMonth()] += a.registeredCount ?? 0;
      });
    return buckets;
  }

  private buildMonthlyFillRates(actions: ActionSummary[]): number[] {
    const sum = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    actions
      .filter(a => a.status === 'PUBLISHED' && !a.isFixed && a.maxParticipants > 0)
      .forEach(a => {
        const m = new Date(a.dateStart).getMonth();
        sum[m] += Math.round(((a.registeredCount ?? 0) / a.maxParticipants) * 100);
        counts[m] += 1;
      });
    return sum.map((total, i) => (counts[i] > 0 ? Math.round(total / counts[i]) : 0));
  }

  ngOnDestroy(): void {
    this.evolutionChart?.destroy();
    this.categoriesChart?.destroy();
    this.fillRateChart?.destroy();
  }
}
