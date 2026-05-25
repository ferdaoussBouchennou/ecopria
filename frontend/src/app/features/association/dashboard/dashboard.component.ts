import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AssociationService } from '../services/association.service';

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
        this.calculateStats(actions);
        this.calculateCategories(actions);
        this.calculateTopActions(actions);
        
        // Create charts after data is ready
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

  calculateStats(actions: any[]): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Actions publiées
    this.stats.actionsPubliees = actions.filter(a => a.status === 'PUBLISHED').length;

    // Inscrits ce mois (simulé)
    this.stats.inscritsCeMois = Math.floor(Math.random() * 50) + 80;

    // Taux de remplissage moyen
    const publishedActions = actions.filter(a => a.status === 'PUBLISHED');
    if (publishedActions.length > 0) {
      const totalFillRate = publishedActions.reduce((sum, action) => {
        const fillRate = (action.currentParticipants / action.maxParticipants) * 100;
        return sum + fillRate;
      }, 0);
      this.stats.tauxRemplissage = Math.round(totalFillRate / publishedActions.length);
    }

    // Inscrits cumulés 12 mois (simulé)
    this.stats.inscritsCumules = Math.floor(Math.random() * 200) + 500;
  }

  calculateCategories(actions: any[]): void {
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

  calculateTopActions(actions: any[]): void {
    this.topActions = actions
      .filter(a => a.status === 'PUBLISHED')
      .map(action => ({
        id: action.id,
        titre: action.titre,
        city: action.city,
        inscrits: action.currentParticipants || 0,
        maxParticipants: action.maxParticipants,
        fillPercentage: Math.round(((action.currentParticipants || 0) / action.maxParticipants) * 100),
        imageUrl: action.imageUrl
      }))
      .sort((a, b) => b.inscrits - a.inscrits)
      .slice(0, 5);
  }

  createEvolutionChart(): void {
    if (!this.evolutionChartRef) return;

    const ctx = this.evolutionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Données simulées pour 12 mois
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = [45, 52, 61, 58, 72, 68, 85, 92, 88, 105, 98, 103];

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
    const data = [55, 62, 58, 71, 68, 75, 72, 78, 82, 76, 85, 88];

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

  ngOnDestroy(): void {
    this.evolutionChart?.destroy();
    this.categoriesChart?.destroy();
    this.fillRateChart?.destroy();
  }
}
