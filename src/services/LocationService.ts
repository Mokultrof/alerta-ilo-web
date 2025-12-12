import { LatLng } from '../types';

export interface LocationPermission {
  granted: boolean;
  accuracy: 'high' | 'low' | 'none';
}

export class LocationService {
  // Coordenadas por defecto de Ilo, Perú
  static readonly ILO_DEFAULT_COORDS: LatLng = {
    latitude: -17.6406,
    longitude: -71.3369
  };

  // Opciones de geolocalización
  static readonly GEOLOCATION_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000 // 5 minutos
  };

  // Verificar si la geolocalización está disponible
  static isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  // Solicitar permisos de ubicación
  static async requestLocationPermission(): Promise<LocationPermission> {
    if (!this.isGeolocationAvailable()) {
      return { granted: false, accuracy: 'none' };
    }

    try {
      // Intentar obtener la ubicación para verificar permisos
      await this.getCurrentPosition();
      return { granted: true, accuracy: 'high' };
    } catch (error: any) {
      console.warn('Error al solicitar permisos de ubicación:', error);
      
      if (error.code === 1) { // PERMISSION_DENIED
        return { granted: false, accuracy: 'none' };
      } else if (error.code === 3) { // TIMEOUT
        return { granted: true, accuracy: 'low' };
      }
      
      return { granted: false, accuracy: 'none' };
    }
  }

  // Obtener posición actual
  static getCurrentPosition(): Promise<LatLng> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationAvailable()) {
        reject(new Error('Geolocalización no disponible'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        this.GEOLOCATION_OPTIONS
      );
    });
  }

  // Obtener ubicación con fallback a Ilo
  static async getLocationWithFallback(): Promise<{
    location: LatLng;
    isUserLocation: boolean;
    accuracy: 'high' | 'low' | 'fallback';
  }> {
    try {
      const userLocation = await this.getCurrentPosition();
      return {
        location: userLocation,
        isUserLocation: true,
        accuracy: 'high'
      };
    } catch (error: any) {
      console.warn('No se pudo obtener ubicación del usuario, usando Ilo por defecto:', error);
      
      return {
        location: this.ILO_DEFAULT_COORDS,
        isUserLocation: false,
        accuracy: 'fallback'
      };
    }
  }

  // Observar cambios de ubicación
  static watchPosition(
    onSuccess: (location: LatLng) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number | null {
    if (!this.isGeolocationAvailable()) {
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      onError,
      this.GEOLOCATION_OPTIONS
    );
  }

  // Detener observación de ubicación
  static clearWatch(watchId: number): void {
    if (this.isGeolocationAvailable()) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  // Calcular distancia entre dos puntos (en metros)
  static calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Verificar si un punto está dentro de Ilo (aproximadamente)
  static isWithinIlo(location: LatLng): boolean {
    const distance = this.calculateDistance(location, this.ILO_DEFAULT_COORDS);
    return distance <= 50000; // 50km de radio
  }

  // Obtener mensaje de error legible
  static getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permisos de ubicación denegados. Usando ubicación de Ilo por defecto.';
      case error.POSITION_UNAVAILABLE:
        return 'Ubicación no disponible. Usando ubicación de Ilo por defecto.';
      case error.TIMEOUT:
        return 'Tiempo de espera agotado. Usando ubicación de Ilo por defecto.';
      default:
        return 'Error desconocido al obtener ubicación. Usando ubicación de Ilo por defecto.';
    }
  }
}