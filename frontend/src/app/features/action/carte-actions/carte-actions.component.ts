import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  private map!: L.Map;
  private markerClusterGroup!: L.MarkerClusterGroup;
  private userMarker?: L.Marker;
  private tileLayer?: L.TileLayer;

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
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    // Ne pas charger les actions ici, attendre que la carte soit initialisée
  }

  ngAfterViewInit(): void {
    // Configurer les icônes par défaut de Leaflet
    const iconRetinaUrl = 'leaflet/marker-icon-2x.png';
    const iconUrl = 'leaflet/marker-icon.png';
    const shadowUrl = 'leaflet/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Attendre que le DOM soit complètement rendu
    setTimeout(() => {
      this.initMap();

      // Vérifier que les tuiles sont visibles après initialisation
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();

          // Vérifier les tuiles dans le DOM
          const tiles = document.querySelectorAll('.leaflet-tile');
          console.log(`📊 Nombre de tuiles dans le DOM: ${tiles.length}`);

          if (tiles.length > 0) {
            const firstTile = tiles[0] as HTMLImageElement;
            console.log('🖼️ Première tuile:', {
              src: firstTile.src,
              opacity: window.getComputedStyle(firstTile).opacity,
              visibility: window.getComputedStyle(firstTile).visibility,
              display: window.getComputedStyle(firstTile).display
            });
          }
        }
      }, 500);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tileLayer) {
      this.tileLayer.remove();
    }
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    try {
      // S'assurer que le conteneur existe
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('❌ Conteneur de carte non trouvé');
        return;
      }

      // Centrer sur Tétouan par défaut
      this.map = L.map('map', {
        center: [35.5889, -5.3626],
        zoom: 13,
        zoomControl: true,
        preferCanvas: false,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true
      });

      // Utiliser les tuiles OpenStreetMap avec options optimisées
      this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 3,
        tileSize: 256,
        zoomOffset: 0,
        detectRetina: false,
        crossOrigin: true,
        keepBuffer: 4,
        updateWhenIdle: true,
        updateWhenZooming: false,
        updateInterval: 200
      });

      this.tileLayer.addTo(this.map);

      // Événements de débogage
      this.tileLayer.on('load', () => {
        console.log('✅ Toutes les tuiles chargées avec succès');
        this.mapLoaded = true;
      });

      this.tileLayer.on('tileerror', (error: any) => {
        console.error('❌ Erreur de chargement de tuile:', error);
      });

      this.tileLayer.on('loading', () => {
        console.log('⏳ Chargement des tuiles en cours...');
      });

      // Forcer le rafraîchissement de la carte
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          this.map.setView([35.5889, -5.3626], 13);
          console.log('🗺️ Carte initialisée et redimensionnée');
        }
      }, 300);

      // Initialiser le cluster group
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

      // Charger les actions maintenant que la carte est prête
      this.loadActions();
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la carte:', error);
    }
  }

  private loadCategories(): void {
    this.actionService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Erreur chargement catégories:', err)
    });
  }

  private loadActions(categoryId?: number): void {
    this.actionService.getActionsForMap(categoryId).subscribe({
      next: (actions) => {
        this.actions = actions.filter(a => a.latitude && a.longitude);
        this.filteredActions = [...this.actions];
        this.updateMarkers();
      },
      error: (err) => console.error('Erreur chargement actions:', err)
    });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.loadActions(categoryId ?? undefined);
  }

  private updateMarkers(): void {
    // Vérifier que le cluster group existe
    if (!this.markerClusterGroup) {
      console.warn('⚠️ Cluster group non initialisé, attente...');
      return;
    }

    // Vider le cluster
    this.markerClusterGroup.clearLayers();

    // Ajouter les nouveaux marqueurs
    this.filteredActions.forEach(action => {
      if (action.latitude && action.longitude) {
        const marker = this.createMarker(action);
        this.markerClusterGroup.addLayer(marker);
      }
    });

    // Ajuster la vue pour afficher tous les marqueurs SEULEMENT si on n'a pas de position utilisateur
    // et qu'il y a des actions à afficher
    if (!this.userLocation && this.filteredActions.length > 0) {
      setTimeout(() => {
        const bounds = this.markerClusterGroup.getBounds();
        if (bounds.isValid()) {
          this.map.fitBounds(bounds.pad(0.1));
        }
      }, 200);
    }
  }

  private createMarker(action: ActionSummary): L.Marker {
    const icon = this.getMarkerIcon(action);
    const marker = L.marker([action.latitude!, action.longitude!], { icon });

    const distance = this.userLocation
      ? this.calculateDistance(this.userLocation.lat, this.userLocation.lng, action.latitude!, action.longitude!)
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
        <button class="popup-btn" onclick="window.location.href='/action/${action.id}'">
          Voir l'action
        </button>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
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
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    this.isLoadingLocation = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        console.log(' Position utilisateur:', this.userLocation);

        if (this.userMarker) {
          this.userMarker.remove();
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

        // Centrer la carte sur la position de l'utilisateur avec animation douce
        this.map.flyTo([this.userLocation.lat, this.userLocation.lng], 13, {
          duration: 1.5
        });

        // Mettre à jour seulement les distances dans la liste, sans refaire fitBounds
        this.filteredActions = [...this.filteredActions];

        this.isLoadingLocation = false;
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Impossible d\'obtenir votre position');
        this.isLoadingLocation = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  searchByAddress(): void {
    if (!this.searchAddress.trim()) return;

    this.isSearching = true;

    // Utiliser l'API Nominatim d'OpenStreetMap pour la géocodage
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchAddress)}&limit=1`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          console.log('🔍 Adresse trouvée:', { lat, lon, name: data[0].display_name });

          this.map.setView([lat, lon], 14);

          // Ajouter un marqueur temporaire
          const searchMarker = L.marker([lat, lon], {
            icon: L.divIcon({
              className: 'search-marker',
              html: '<div class="search-marker-pin">📍</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            })
          }).addTo(this.map);

          searchMarker.bindPopup(`<b>${data[0].display_name}</b>`).openPopup();

          setTimeout(() => {
            searchMarker.remove();
          }, 5000);
        } else {
          alert('Adresse non trouvée');
        }
        this.isSearching = false;
      })
      .catch(error => {
        console.error('Erreur de recherche:', error);
        alert('Erreur lors de la recherche');
        this.isSearching = false;
      });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
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
    this.router.navigate(['/action', actionId]);
  }
}
