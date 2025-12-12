import { useState, useEffect, useCallback } from 'react';
import { GeolocationService, GeolocationResult } from '../services/GeolocationService';
import { LatLng } from '../types';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  watch?: boolean;
  onLocationChange?: (location: GeolocationResult) => void;
  onError?: (error: string) => void;
}

interface UseGeolocationReturn {
  location: LatLng | null;
  accuracy: number;
  loading: boolean;
  error: string | null;
  isInIlo: boolean;
  getCurrentLocation: () => Promise<void>;
  watchId: number | null;
}

export const useGeolocation = (options: UseGeolocationOptions = {}): UseGeolocationReturn => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true
      });

      setLocation(result.position);
      setAccuracy(result.accuracy);
      
      if (options.onLocationChange) {
        options.onLocationChange(result);
      }

      console.log('📍 Ubicación actualizada:', {
        lat: result.position.latitude,
        lng: result.position.longitude,
        accuracy: result.accuracy
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Error al obtener ubicación';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }

      // Usar ubicación por defecto en caso de error
      const defaultLocation = {
        latitude: -17.6394,
        longitude: -71.3378
      };
      setLocation(defaultLocation);
      setAccuracy(0);

    } finally {
      setLoading(false);
    }
  }, [options]);

  // Inicializar ubicación al montar el componente
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Configurar watch si está habilitado
  useEffect(() => {
    if (options.watch && !watchId) {
      const id = GeolocationService.watchPosition(
        (result) => {
          setLocation(result.position);
          setAccuracy(result.accuracy);
          
          if (options.onLocationChange) {
            options.onLocationChange(result);
          }
        },
        (error) => {
          const errorMessage = `Error de geolocalización: ${error.message}`;
          setError(errorMessage);
          
          if (options.onError) {
            options.onError(errorMessage);
          }
        }
      );

      setWatchId(id);
    }

    return () => {
      if (watchId) {
        GeolocationService.clearWatch(watchId);
        setWatchId(null);
      }
    };
  }, [options.watch, watchId, options]);

  const isInIlo = location ? GeolocationService.isInIlo(location) : false;

  return {
    location,
    accuracy,
    loading,
    error,
    isInIlo,
    getCurrentLocation,
    watchId
  };
};