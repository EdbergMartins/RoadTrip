import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import Feature from 'ol/Feature';
import OlMap from 'ol/Map';
import View from 'ol/View';
import type Geometry from 'ol/geom/Geometry';
import type { Extent } from 'ol/extent';
import TopoJSON from 'ol/format/TopoJSON';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

interface Municipality {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
  regionName: string;
  intermediateRegion: string;
  areaKm2: number;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly storageKey = 'roadtrip.visited-municipalities';
  private readonly municipalityDataUrl = '/data/br-municipios-2024.topo.json';
  private readonly initialCenter = fromLonLat([-54.5, -14.5]);
  private readonly initialZoom = 4.2;
  private readonly listDisplayLimit = 300;
  private readonly styleCache = new Map<string, Style[]>();
  private readonly detailStyleCache = new Map<string, Style[]>();
  private readonly municipalityFeatures = new Map<string, Feature<Geometry>>();
  private readonly detailSource = new VectorSource<Feature<Geometry>>();

  @ViewChild('mapHost', { static: true }) private mapHost?: ElementRef<HTMLDivElement>;
  @ViewChild('detailMapHost', { static: true }) private detailMapHost?: ElementRef<HTMLDivElement>;

  readonly municipalities = signal<Municipality[]>([]);
  readonly searchTerm = signal('');
  readonly pinnedMunicipalityId = signal('');
  readonly activeState = signal('Todos');
  readonly activeMunicipalityId = signal('');
  readonly visitedMunicipalityIds = signal<string[]>(this.readVisitedMunicipalities());
  readonly loadingMap = signal(true);
  readonly loadingMessage = signal('Carregando a malha municipal de 2024...');
  readonly loadingError = signal('');

  readonly states = computed(() => [
    'Todos',
    ...new Set(this.municipalities().map((municipality) => municipality.stateCode))
  ]);

  readonly filteredMunicipalities = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const state = this.activeState();
    const pinnedMunicipalityId = this.pinnedMunicipalityId();

    return this.municipalities().filter((municipality) => {
      if (pinnedMunicipalityId) {
        return municipality.id === pinnedMunicipalityId;
      }

      const matchesState = state === 'Todos' || municipality.stateCode === state;
      const matchesSearch =
        search.length === 0 ||
        `${municipality.name} ${municipality.stateCode} ${municipality.stateName} ${municipality.regionName} ${municipality.intermediateRegion}`
          .toLowerCase()
          .includes(search);

      return matchesState && matchesSearch;
    });
  });

  readonly visibleMunicipalityIds = computed(
    () => new Set(this.filteredMunicipalities().map((municipality) => municipality.id))
  );

  readonly searchSuggestions = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const state = this.activeState();

    if (this.pinnedMunicipalityId() || search.length < 2) {
      return [];
    }

    return this.municipalities()
      .filter((municipality) => {
        const matchesState = state === 'Todos' || municipality.stateCode === state;
        const matchesSearch = `${municipality.name} ${municipality.stateCode} ${municipality.stateName}`
          .toLowerCase()
          .includes(search);

        return matchesState && matchesSearch;
      })
      .slice(0, 8);
  });

  readonly listedMunicipalities = computed(() => {
    const activeId = this.activeMunicipalityId();
    const filtered = this.filteredMunicipalities();
    const limited = filtered.slice(0, this.listDisplayLimit);

    if (!activeId || limited.some((municipality) => municipality.id === activeId)) {
      return limited;
    }

    const activeMunicipality = filtered.find((municipality) => municipality.id === activeId);

    if (!activeMunicipality) {
      return limited;
    }

    return [activeMunicipality, ...limited.slice(0, this.listDisplayLimit - 1)];
  });

  readonly hiddenFilteredCount = computed(() =>
    Math.max(this.filteredMunicipalities().length - this.listedMunicipalities().length, 0)
  );

  readonly totalMunicipalities = computed(() => this.municipalities().length);
  readonly visitedCount = computed(() => this.visitedMunicipalityIds().length);
  readonly activeMunicipality = computed(() => {
    const currentId = this.activeMunicipalityId();

    return (
      this.municipalities().find((municipality) => municipality.id === currentId) ??
      this.filteredMunicipalities()[0]
    );
  });
  readonly activeMunicipalityVisited = computed(() => {
    const municipality = this.activeMunicipality();
    return municipality ? this.isVisited(municipality.id) : false;
  });

  readonly completion = computed(() =>
    this.totalMunicipalities() === 0
      ? 0
      : Math.round((this.visitedCount() / this.totalMunicipalities()) * 100)
  );

  private map?: OlMap;
  private detailMap?: OlMap;
  private municipalitiesLayer?: VectorLayer<VectorSource<Feature<Geometry>>>;
  private detailMunicipalityLayer?: VectorLayer<VectorSource<Feature<Geometry>>>;

  constructor() {
    effect(() => {
      const ids = this.visitedMunicipalityIds();

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(ids));
      }
    });

    effect(
      () => {
        const visibleIds = this.visibleMunicipalityIds();
        const currentId = this.activeMunicipalityId();

        if (visibleIds.size > 0 && !visibleIds.has(currentId)) {
          const nextMunicipality = this.filteredMunicipalities()[0];

          if (nextMunicipality) {
            this.activeMunicipalityId.set(nextMunicipality.id);
          }
        }
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      this.activeMunicipality();
      this.activeMunicipalityVisited();
      this.visitedMunicipalityIds();
      this.visibleMunicipalityIds();
      this.municipalitiesLayer?.changed();
      this.detailMunicipalityLayer?.changed();
      this.syncDetailMunicipalityMap();
    });

    effect(() => {
      const activeMunicipality = this.activeMunicipality();

      if (!activeMunicipality) {
        return;
      }

      this.focusMunicipality(activeMunicipality.id);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    this.initializeMap();
    this.initializeDetailMap();
    await this.loadMunicipalities();
  }

  ngOnDestroy(): void {
    this.map?.setTarget(undefined);
    this.detailMap?.setTarget(undefined);
  }

  trackByMunicipalityId(_: number, municipality: Municipality): string {
    return municipality.id;
  }

  setState(state: string): void {
    this.pinnedMunicipalityId.set('');
    this.activeState.set(state);
  }

  updateSearchTerm(value: string): void {
    this.pinnedMunicipalityId.set('');
    this.searchTerm.set(value);
  }

  selectSearchSuggestion(municipalityId: string): void {
    const municipality = this.municipalities().find((item) => item.id === municipalityId);

    if (!municipality) {
      return;
    }

    this.pinnedMunicipalityId.set(municipality.id);
    this.activeState.set(municipality.stateCode);
    this.searchTerm.set(municipality.name);
    this.activeMunicipalityId.set(municipality.id);
    this.focusMunicipality(municipality.id);
  }

  clearVisited(): void {
    this.visitedMunicipalityIds.set([]);
  }

  isVisited(municipalityId: string): boolean {
    return this.visitedMunicipalityIds().includes(municipalityId);
  }

  isVisible(municipalityId: string): boolean {
    return this.visibleMunicipalityIds().has(municipalityId);
  }

  selectMunicipality(municipalityId: string, toggleVisited = false): void {
    this.activeMunicipalityId.set(municipalityId);

    if (toggleVisited) {
      this.toggleVisited(municipalityId);
    }
  }

  toggleVisited(municipalityId: string): void {
    this.activeMunicipalityId.set(municipalityId);

    this.visitedMunicipalityIds.update((currentIds) =>
      currentIds.includes(municipalityId)
        ? currentIds.filter((currentId) => currentId !== municipalityId)
        : [...currentIds, municipalityId]
    );
  }

  private readVisitedMunicipalities(): string[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const storedValue = localStorage.getItem(this.storageKey);

    if (!storedValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(storedValue);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private initializeMap(): void {
    if (!this.mapHost) {
      return;
    }

    this.municipalitiesLayer = new VectorLayer({
      source: new VectorSource(),
      declutter: true,
      style: (feature) => this.getMunicipalityStyle(feature as Feature<Geometry>),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    });

    this.map = new OlMap({
      target: this.mapHost.nativeElement,
      layers: [this.municipalitiesLayer],
      view: new View({
        center: this.initialCenter,
        zoom: this.initialZoom,
        minZoom: 3.5,
        maxZoom: 13
      }),
      controls: []
    });

    this.map.on('singleclick', (event) => {
      const feature = this.map?.forEachFeatureAtPixel(event.pixel, (hitFeature) => hitFeature);
      const municipalityId = feature?.get('municipalityId');

      if (typeof municipalityId === 'string') {
        this.selectMunicipality(municipalityId);
      }
    });

    this.map.on('pointermove', (event) => {
      const target = this.map?.getTargetElement();

      if (!target) {
        return;
      }

      target.style.cursor = this.map?.hasFeatureAtPixel(event.pixel) ? 'pointer' : '';
    });
  }

  private initializeDetailMap(): void {
    if (!this.detailMapHost) {
      return;
    }

    this.detailMunicipalityLayer = new VectorLayer({
      source: this.detailSource,
      style: (feature) => this.getDetailMunicipalityStyle(feature as Feature<Geometry>)
    });

    this.detailMap = new OlMap({
      target: this.detailMapHost.nativeElement,
      layers: [this.detailMunicipalityLayer],
      view: new View({
        center: this.initialCenter,
        zoom: 5,
        minZoom: 4,
        maxZoom: 15
      }),
      controls: []
    });
  }

  private async loadMunicipalities(): Promise<void> {
    try {
      this.loadingMap.set(true);
      this.loadingError.set('');
      this.loadingMessage.set('Carregando a malha municipal otimizada...');

      const topology = await this.fetchJson<Record<string, unknown>>(this.municipalityDataUrl);
      const format = new TopoJSON();
      const features = format.readFeatures(topology, {
        featureProjection: 'EPSG:3857'
      }) as Feature<Geometry>[];

      const municipalities = features
        .map((feature: Feature<Geometry>) =>
          this.mapMunicipality(feature.getProperties() as Record<string, unknown>)
        )
        .filter((municipality: Municipality | null): municipality is Municipality => municipality !== null)
        .sort((left: Municipality, right: Municipality) => left.name.localeCompare(right.name, 'pt-BR'));

      this.municipalities.set(municipalities);

      if (!this.activeMunicipalityId() && municipalities.length > 0) {
        this.activeMunicipalityId.set(municipalities[0].id);
      }

      features.forEach((feature) => {
        const municipalityId = String(feature.get('CD_MUN') ?? '');
        const municipalityName = String(feature.get('NM_MUN') ?? '');
        feature.set('municipalityId', municipalityId);
        feature.set('municipalityName', municipalityName);
        this.municipalityFeatures.set(municipalityId, feature);
      });

      this.municipalitiesLayer?.getSource()?.clear(true);
      this.municipalitiesLayer?.getSource()?.addFeatures(features);

      const extent = this.municipalitiesLayer?.getSource()?.getExtent();

      if (extent && this.isValidExtent(extent)) {
        this.map?.getView().fit(extent, {
          padding: [32, 32, 32, 32],
          duration: 450,
          maxZoom: 8
        });
      }

      this.syncDetailMunicipalityMap();
      this.loadingMessage.set(`Malha municipal carregada com ${municipalities.length} municipios.`);
    } catch (error) {
      this.loadingError.set(
        'Nao foi possivel carregar a malha municipal. Confira se o arquivo TopoJSON otimizado esta disponivel.'
      );
      this.loadingMessage.set('');
      console.error(error);
    } finally {
      this.loadingMap.set(false);
    }
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Falha ao carregar ${path}: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private mapMunicipality(properties: Record<string, unknown> | null | undefined): Municipality | null {
    if (!properties) {
      return null;
    }

    const id = String(properties['CD_MUN'] ?? '').trim();
    const name = String(properties['NM_MUN'] ?? '').trim();

    if (!id || !name) {
      return null;
    }

    return {
      id,
      name,
      stateCode: String(properties['SIGLA_UF'] ?? '').trim(),
      stateName: String(properties['NM_UF'] ?? '').trim(),
      regionName: String(properties['NM_REGIA'] ?? '').trim(),
      intermediateRegion: String(properties['NM_RGINT'] ?? '').trim(),
      areaKm2: Number(properties['AREA_KM2'] ?? 0)
    };
  }

  private focusMunicipality(municipalityId: string): void {
    const feature = this.municipalityFeatures.get(municipalityId);
    const geometry = feature?.getGeometry();

    if (!geometry || !this.map) {
      return;
    }

    this.map.getView().fit(geometry.getExtent(), {
      padding: [48, 48, 48, 48],
      duration: 300,
      maxZoom: 9
    });
  }

  private syncDetailMunicipalityMap(): void {
    const municipality = this.activeMunicipality();

    if (!municipality || !this.activeMunicipalityVisited()) {
      this.detailSource.clear(true);
      return;
    }

    const feature = this.municipalityFeatures.get(municipality.id);

    if (!feature) {
      this.detailSource.clear(true);
      return;
    }

    const detailFeature = feature.clone();
    detailFeature.set('municipalityId', municipality.id);
    detailFeature.set('municipalityName', municipality.name);

    this.detailSource.clear(true);
    this.detailSource.addFeature(detailFeature);

    const geometry = detailFeature.getGeometry();

    if (!geometry || !this.detailMap) {
      return;
    }

    this.detailMap.getView().fit(geometry.getExtent(), {
      padding: [36, 36, 36, 36],
      duration: 280,
      maxZoom: 12
    });
  }

  private getMunicipalityStyle(feature: Feature<Geometry>): Style[] {
    const municipalityId = String(feature.get('municipalityId') ?? '');
    const municipalityName = String(feature.get('municipalityName') ?? '');
    const isVisited = this.isVisited(municipalityId);
    const isActive = this.activeMunicipalityId() === municipalityId;
    const isVisible = this.isVisible(municipalityId);
    const styleKey = `${municipalityId}-${isVisited}-${isActive}-${isVisible}`;

    const cachedStyle = this.styleCache.get(styleKey);

    if (cachedStyle) {
      return cachedStyle;
    }

    const strokeColor = isVisible ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.22)';
    const fillColor = isActive
      ? 'rgba(255,255,255,0.12)'
      : isVisited
        ? 'rgba(245, 158, 11, 0.58)'
        : 'rgba(0,0,0,1)';

    const styles = [
      new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({
          color: isVisited && isVisible ? 'rgba(254, 240, 138, 0.96)' : strokeColor,
          width: isActive ? 1.8 : isVisited ? 1.4 : 0.7
        }),
        zIndex: isActive ? 3 : isVisited ? 2 : 1
      }),
      new Style({
        text: new Text({
          text: municipalityName,
          overflow: true,
          font: isActive ? '700 11px "Space Grotesk", sans-serif' : '500 9px "Space Grotesk", sans-serif',
          fill: new Fill({
            color: isVisited && isVisible ? '#fff7d6' : isVisible ? '#ffffff' : 'rgba(255,255,255,0.3)'
          }),
          stroke: new Stroke({ color: 'rgba(0,0,0,0.96)', width: isVisited ? 4 : 3 }),
          padding: [2, 3, 2, 3]
        }),
        zIndex: 4
      })
    ];

    this.styleCache.set(styleKey, styles);
    return styles;
  }

  private getDetailMunicipalityStyle(feature: Feature<Geometry>): Style[] {
    const municipalityId = String(feature.get('municipalityId') ?? '');
    const municipalityName = String(feature.get('municipalityName') ?? '');
    const styleKey = `${municipalityId}-${municipalityName}`;
    const cachedStyle = this.detailStyleCache.get(styleKey);

    if (cachedStyle) {
      return cachedStyle;
    }

    const styles = [
      new Style({
        fill: new Fill({ color: '#000000' }),
        stroke: new Stroke({ color: '#ffffff', width: 2.2 }),
        zIndex: 1
      }),
      new Style({
        text: new Text({
          text: municipalityName,
          overflow: true,
          font: '700 18px "Space Grotesk", sans-serif',
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color: '#000000', width: 4 }),
          padding: [4, 6, 4, 6]
        }),
        zIndex: 2
      })
    ];

    this.detailStyleCache.set(styleKey, styles);
    return styles;
  }

  private isValidExtent(extent: Extent): boolean {
    return extent.every((value) => Number.isFinite(value));
  }
}

