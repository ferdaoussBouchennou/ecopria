import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { ActionService } from '../services/action.service';
import { ActionSummary, Category } from '../models/action.model';
import { getCategoryMeta } from '../constants/category-meta';
import { formatNaiveTime, parseNaiveDateTime } from '../../../core/utils/datetime-local.util';

@Component({
  selector: 'app-carte-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './carte-actions.component.html',
  styleUrls: ['./carte-actions.component.scss']
})
export class CarteActionsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private markerClusterGroup?: L.MarkerClusterGroup;
  private userMarker?: L.Marker;
  private tileLayer?: L.TileLayer;
  private destroyed = false;
  private mapReady = false;
  private readonly timers: ReturnType<typeof setTimeout>[] = [];
  private readonly subs: Subscription[] = [];

  actions: ActionSummary[] = [];
  filteredActions: ActionSummary[] = [];
  categories: Category[] = [];
  selectedCategoryId: number | null = null;
  userLocation: { lat: number; lng: number } | null = null;
  isLoadingLocation = false;
  searchAddress = '';
  isSearching = false;
  mapLoaded = false;

  constructor(
    private actionService: ActionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    const iconDefault = L.icon({
      iconRetinaUrl: 'leaflet/marker-icon-2x.png',
      iconUrl: 'leaflet/marker-icon.png',
      shadowUrl: 'leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    this.schedule(() => this.initMap(), 50);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.length = 0;
    this.subs.forEach((s) => s.unsubscribe());
    this.subs.length = 0;
    this.destroyMap();
  }

  private schedule(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      if (!this.destroyed) fn();
    }, ms);
    this.timers.push(id);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.closePopup();
      this.map.stop();

      if (this.userMarker) {
        this.map.removeLayer(this.userMarker);
        this.userMarker = undefined;
      }

      if (this.markerClusterGroup) {
        this.markerClusterGroup.clearLayers();
        this.map.removeLayer(this.markerClusterGroup);
        this.markerClusterGroup = undefined;
      }

      if (this.tileLayer) {
        this.map.removeLayer(this.tileLayer);
        this.tileLayer = undefined;
      }

      this.map.off();
      this.map.remove();
      this.map = undefined;
    }

    this.mapReady = false;

    const el = this.mapContainerRef?.nativeElement;
    if (el) {
      el.innerHTML = '';
      delete (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    }
  }

  private initMap(): void {
    if (this.destroyed || this.map) return;

    const container = this.mapContainerRef?.nativeElement;
    if (!container) return;

    try {
      this.map = L.map(container, {
        center: [35.5889, -5.3626],
        zoom: 13,
        zoomControl: true,
        preferCanvas: true,
        attributionControl: false
      });

      this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 3,
        updateWhenIdle: true,
        updateWhenZooming: false
      });

      this.tileLayer.addTo(this.map);
      this.tileLayer.once('load', () => {
        if (!this.destroyed) this.mapLoaded = true;
      });

      this.markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count > 10) size = 'large';
          else if (count > 5) size = 'medium';

          return L.divIcon({
            html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40)
          });
        }
      });

      this.map.addLayer(this.markerClusterGroup);
      this.mapReady = true;

      this.schedule(() => {
        if (this.map && !this.destroyed) {
          this.map.invalidateSize();
        }
      }, 200);

      this.loadActions();
    } catch (error) {
      console.error('Erreur initialisation carte:', error);
    }
  }

  private loadCategories(): void {
    const sub = this.actionService.getCategories().subscribe({
      next: (categories) => {
        if (this.destroyed) return;
        this.categories = categories;
      },
      error: (err) => console.error('Erreur chargement catégories:', err)
    });
    this.subs.push(sub);
  }

  private loadActions(categoryId?: number): void {
    const sub = this.actionService.getActionsForMap(categoryId).subscribe({
      next: (actions) => {
        if (this.destroyed) return;
        this.actions = actions.filter((a) => a.latitude && a.longitude);
        this.filteredActions = [...this.actions];
        this.updateMarkers();
      },
      error: (err) => console.error('Erreur chargement actions:', err)
    });
    this.subs.push(sub);
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.loadActions(categoryId ?? undefined);
  }

  private updateMarkers(): void {
    if (this.destroyed || !this.mapReady || !this.markerClusterGroup || !this.map) return;

    this.markerClusterGroup.clearLayers();

    this.filteredActions.forEach((action) => {
      if (action.latitude && action.longitude) {
        this.markerClusterGroup!.addLayer(this.createMarker(action));
      }
    });

    if (!this.userLocation && this.filteredActions.length > 0) {
      this.schedule(() => {
        if (this.destroyed || !this.markerClusterGroup || !this.map) return;
        const bounds = this.markerClusterGroup.getBounds();
        if (bounds.isValid()) {
          this.map!.fitBounds(bounds.pad(0.1), { animate: false });
        }
      }, 150);
    }
  }

  private createMarker(action: ActionSummary): L.Marker {
    const icon = this.getMarkerIcon(action);
    const marker = L.marker([action.latitude!, action.longitude!], { icon });

    const distance = this.userLocation
      ? this.calculateDistance(
          this.userLocation.lat,
          this.userLocation.lng,
          action.latitude!,
          action.longitude!
        )
      : null;

    const popupContent = `
      <div class="marker-popup">
        <div class="popup-category">${action.categoryName.toUpperCase()}</div>
        <h3 class="popup-title">${action.title}</h3>
        <div class="popup-info">
          <div class="popup-date">${this.formatDate(action.dateStart)}</div>
          <div class="popup-places">${action.availablePlaces} places</div>
          <div class="popup-points">${action.points} pts</div>
          ${distance ? `<div class="popup-distance">${distance.toFixed(1)} km</div>` : ''}
        </div>
        <button type="button" class="popup-btn" data-action-id="${action.id}">
          Voir l'action
        </button>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });

    marker.on('popupopen', () => {
      const btn = document.querySelector(
        `.custom-popup button[data-action-id="${action.id}"]`
      ) as HTMLButtonElement | null;
      if (btn) {
        btn.onclick = () => this.navigateToAction(action.id);
      }
    });

    return marker;
  }

  private getMarkerIcon(action: ActionSummary): L.DivIcon {
    const fillRate = action.availablePlaces / action.maxParticipants;
    let color: string;

    if (fillRate > 0.5) {
      color = '#2D6A4F';
    } else if (fillRate > 0.1) {
      color = '#F59E0B';
    } else {
      color = '#DC2626';
    }

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-pin" style="background-color: ${color};">
          <div class="marker-inner"></div>
        </div>
      `,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -42]
    });
  }

  locateUser(): void {
    if (this.destroyed || !navigator.geolocation || !this.map) return;

    this.isLoadingLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (this.destroyed || !this.map) return;

        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (this.userMarker) {
          this.map.removeLayer(this.userMarker);
        }

        const userIcon = L.divIcon({
          className: 'user-marker',
          html: `
            <div class="user-marker-pin">
              <div class="user-marker-pulse"></div>
              <div class="user-marker-dot"></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(this.map);

        this.userMarker.bindPopup('Vous êtes ici');
        this.map.flyTo([this.userLocation.lat, this.userLocation.lng], 13, { duration: 1 });

        this.filteredActions = [...this.filteredActions];
        this.isLoadingLocation = false;
      },
      () => {
        if (this.destroyed) return;
        alert('Impossible d\'obtenir votre position');
        this.isLoadingLocation = false;
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 }
    );
  }

  searchByAddress(): void {
    if (this.destroyed || !this.searchAddress.trim() || !this.map) return;

    this.isSearching = true;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchAddress)}&limit=1`
    )
      .then((response) => response.json())
      .then((data) => {
        if (this.destroyed || !this.map) return;

        if (data?.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          this.map.setView([lat, lon], 14);

          const searchMarker = L.marker([lat, lon], {
            icon: L.divIcon({
              className: 'search-marker',
              html: '<div class="search-marker-pin"></div>',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            })
          }).addTo(this.map);

          searchMarker.bindPopup(`<b>${data[0].display_name}</b>`).openPopup();

          this.schedule(() => {
            if (this.map) this.map.removeLayer(searchMarker);
          }, 5000);
        } else {
          alert('Adresse non trouvée');
        }
        this.isSearching = false;
      })
      .catch(() => {
        if (this.destroyed) return;
        alert('Erreur lors de la recherche');
        this.isSearching = false;
      });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getDistance(action: ActionSummary): string | null {
    if (!this.userLocation || !action.latitude || !action.longitude) {
      return null;
    }
    const distance = this.calculateDistance(
      this.userLocation.lat,
      this.userLocation.lng,
      action.latitude,
      action.longitude
    );
    return `${distance.toFixed(1)} km`;
  }

  formatDate(dateStr: string): string {
    const date = parseNaiveDateTime(dateStr);
    const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatTime(dateStr: string): string {
    return formatNaiveTime(dateStr);
  }

  getAvailabilityClass(action: ActionSummary): string {
    const fillRate = action.availablePlaces / action.maxParticipants;
    if (fillRate > 0.5) return 'disponible';
    if (fillRate > 0.1) return 'bientot-complet';
    return 'complet';
  }

  getCategoryMeta(name: string) {
    return getCategoryMeta(name);
  }

  navigateToAction(actionId: number): void {
    if (this.destroyed) return;
    this.destroyMap();
    void this.router.navigate(['/action', actionId]);
  }
}
