/**
 * Servicio de Geolocalización Mejorado
 * Proporciona ubicación precisa del usuario con fallbacks
 */

import { LatLng } from '../types';

export interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

export interface GeolocationResult {
    position: LatLng;
    accuracy: number;
    timestamp: number;
}

export class GeolocationService {
    // Coordenadas más precisas del centro de Ilo, Perú
    private static readonly DEFAULT_LOCATION: LatLng = {
        latitude: -17.6394,  // Plaza de Armas de Ilo
        longitude: -71.3378
    };

    private static readonly HIGH_ACCURACY_OPTIONS: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,        // Más tiempo para GPS
        maximumAge: 0          // Siempre obtener ubicación fresca
    };

    private static readonly LOW_ACCURACY_OPTIONS: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000      // Usar caché de 1 minuto
    };

    private static readonly WATCH_OPTIONS: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000       // Actualizar cada 5 segundos
    };

    /**
     * Obtiene la ubicación actual del usuario con alta precisión
     */
    static async getCurrentPosition(
        options: GeolocationOptions = {}
    ): Promise<GeolocationResult> {
        if (!navigator.geolocation) {
            console.warn('Geolocalización no soportada, usando ubicación por defecto');
            return {
                position: this.DEFAULT_LOCATION,
                accuracy: 0,
                timestamp: Date.now()
            };
        }

        try {
            // Intentar primero con alta precisión
            const position = await this.getPositionWithTimeout(
                this.HIGH_ACCURACY_OPTIONS
            );

            console.log('✅ Ubicación obtenida con alta precisión:', {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            });

            return {
                position: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                },
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            };
        } catch (highAccuracyError) {
            console.warn('⚠️ Alta precisión falló, intentando con baja precisión...');

            try {
                // Fallback a baja precisión
                const position = await this.getPositionWithTimeout(
                    this.LOW_ACCURACY_OPTIONS
                );

                console.log('✅ Ubicación obtenida con baja precisión:', {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });

                return {
                    position: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    },
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
            } catch (lowAccuracyError) {
                console.warn('⚠️ Geolocalización falló, usando ubicación por defecto');
                return {
                    position: this.DEFAULT_LOCATION,
                    accuracy: 0,
                    timestamp: Date.now()
                };
            }
        }
    }

    /**
     * Obtiene la posición con timeout
     */
    private static getPositionWithTimeout(
        options: PositionOptions
    ): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }

    /**
     * Observa cambios en la ubicación del usuario
     */
    static watchPosition(
        callback: (result: GeolocationResult) => void,
        errorCallback?: (error: GeolocationPositionError) => void
    ): number {
        if (!navigator.geolocation) {
            console.warn('Geolocalización no soportada');
            return -1;
        }

        return navigator.geolocation.watchPosition(
            (position) => {
                callback({
                    position: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    },
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            errorCallback,
            this.HIGH_ACCURACY_OPTIONS
        );
    }

    /**
     * Detiene la observación de ubicación
     */
    static clearWatch(watchId: number): void {
        if (watchId !== -1 && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
        }
    }

    /**
     * Calcula la distancia entre dos puntos (en metros)
     */
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

    /**
     * Formatea la distancia para mostrar
     */
    static formatDistance(meters: number): string {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }

    /**
     * Verifica si el usuario está en Ilo
     */
    static isInIlo(position: LatLng): boolean {
        const distance = this.calculateDistance(position, this.DEFAULT_LOCATION);
        // Considerar que está en Ilo si está a menos de 20km del centro
        return distance < 20000;
    }

    /**
     * Solicita permisos de geolocalización
     */
    static async requestPermission(): Promise<boolean> {
        if (!navigator.permissions) {
            // Si no hay API de permisos, intentar obtener ubicación directamente
            try {
                await this.getCurrentPosition();
                return true;
            } catch {
                return false;
            }
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state === 'granted';
        } catch {
            return false;
        }
    }
}
