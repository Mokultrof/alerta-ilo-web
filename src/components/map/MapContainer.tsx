import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { LatLng, Report, Post } from '../../types';
import { getReportTypeIcon, getReportTypeColor } from '../../config/reportTypes';
import { LocationService } from '../../services/LocationService';
import 'leaflet/dist/leaflet.css';
import './Map.css';

// Fix para los iconos de Leaflet en React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Función para crear iconos personalizados para reportes
const createReportIcon = (report: Report, isUserReport: boolean = false) => {
  const categoryColor = getReportTypeColor(report.category);
  const categoryIcon = getReportTypeIcon(report.category);
  const borderColor = isUserReport ? '#667eea' : 'white';
  const borderWidth = isUserReport ? '3px' : '2px';
  const size = isUserReport ? 38 : 32;

  // Color de prioridad para el borde interno
  const priorityColors = {
    low: '#2ED573',
    medium: '#FFA502',
    high: '#FF4757'
  };

  return divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isUserReport ? '18px' : '16px'};
        border: ${borderWidth} solid ${borderColor};
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${categoryIcon}
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: ${priorityColors[report.priority]};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        "></div>
      </div>
      ${isUserReport ? '<div style="position: absolute; top: -6px; right: -6px; background: #667eea; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white;">👤</div>' : ''}
    `,
    className: `custom-report-marker ${isUserReport ? 'user-report-marker' : ''} priority-${report.priority}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Función para crear iconos personalizados para posts
const createPostIcon = (post: Post, isUserPost: boolean = false) => {
  const borderColor = isUserPost ? '#667eea' : '#F59E0B'; // Naranja para posts
  const size = isUserPost ? 38 : 32;

  return divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #F59E0B 0%, #F59E0Bdd 100%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isUserPost ? '18px' : '16px'};
        border: 2px solid ${borderColor};
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        📸
      </div>
      ${isUserPost ? '<div style="position: absolute; top: -6px; right: -6px; background: #667eea; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white;">👤</div>' : ''}
    `,
    className: `custom-post-marker ${isUserPost ? 'user-post-marker' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Función para formatear la fecha
const formatDate = (date: Date) => {
  // Validar que la fecha sea válida
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
};

interface MapProps {
  onLocationSelect?: (location: LatLng) => void;
  reports?: Report[];
  posts?: Post[];
  onReportClick?: (report: Report) => void;
  onPostClick?: (post: Post) => void;
  currentUserId?: string;
  className?: string;
}

// Componente para manejar eventos del mapa
const MapEventHandler: React.FC<{ onLocationSelect?: (location: LatLng) => void }> = ({
  onLocationSelect
}) => {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
      }
    }
  });

  return null;
};

// Función para calcular si hay un reporte cercano a un post
const hasNearbyReport = (postLat: number, postLng: number, reports: Report[]): boolean => {
  const threshold = 0.0001; // ~10 metros
  return reports.some(report =>
    Math.abs(report.location.lat - postLat) < threshold &&
    Math.abs(report.location.lng - postLng) < threshold
  );
};

// Función para obtener offset para marcadores superpuestos
const getMarkerOffset = (postLat: number, postLng: number, reports: Report[]): { lat: number; lng: number } => {
  if (hasNearbyReport(postLat, postLng, reports)) {
    // Desplazar el post ~15 metros hacia el noreste
    return { lat: postLat + 0.00015, lng: postLng + 0.00015 };
  }
  return { lat: postLat, lng: postLng };
};

const InteractiveMap: React.FC<MapProps> = ({
  onLocationSelect,
  reports = [],
  posts = [],
  onReportClick,
  onPostClick,
  currentUserId,
  className = ''
}) => {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(LocationService.ILO_DEFAULT_COORDS);
  const [isUserLocation, setIsUserLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<'high' | 'low' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  // Inicializar ubicación al montar el componente
  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await LocationService.getLocationWithFallback();

      setMapCenter(result.location);
      setLocationAccuracy(result.accuracy);

      if (result.isUserLocation) {
        setUserLocation(result.location);
        setIsUserLocation(true);
      } else {
        setIsUserLocation(false);
      }
    } catch (error: any) {
      console.error('Error al inicializar ubicación:', error);
      setError('No se pudo cargar la ubicación');
    } finally {
      setLoading(false);
    }
  };

  const handleCenterOnUser = async () => {
    try {
      const location = await LocationService.getCurrentPosition();
      setUserLocation(location);
      setMapCenter(location);
      setIsUserLocation(true);
      setLocationAccuracy('high');

      // Centrar el mapa en la nueva ubicación
      if (mapRef.current) {
        mapRef.current.setView([location.latitude, location.longitude], 15);
      }
    } catch (error: any) {
      const message = LocationService.getLocationErrorMessage(error);
      setError(message);
      console.error('Error al obtener ubicación:', error);
    }
  };

  const handleCenterOnIlo = () => {
    setMapCenter(LocationService.ILO_DEFAULT_COORDS);
    if (mapRef.current) {
      mapRef.current.setView([
        LocationService.ILO_DEFAULT_COORDS.latitude,
        LocationService.ILO_DEFAULT_COORDS.longitude
      ], 13);
    }
  };

  if (loading) {
    return (
      <div className={`map-container loading ${className}`}>
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-container ${className}`}>
      {error && (
        <div className="map-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      <div className="map-controls">
        <button
          onClick={handleCenterOnUser}
          className="map-control-btn"
          title="Centrar en mi ubicación"
        >
          📍 Mi Ubicación
        </button>
        <button
          onClick={handleCenterOnIlo}
          className="map-control-btn"
          title="Centrar en Ilo"
        >
          🏠 Ilo
        </button>
      </div>

      <div className="map-info">
        <span className={`location-status ${locationAccuracy}`}>
          {locationAccuracy === 'high' && '🟢 Ubicación precisa'}
          {locationAccuracy === 'low' && '🟡 Ubicación aproximada'}
          {locationAccuracy === 'fallback' && '🔴 Ubicación por defecto (Ilo)'}
        </span>
      </div>

      <MapContainer
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={isUserLocation ? 15 : 13}
        className="leaflet-map"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcador de ubicación del usuario */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
          >
            <Popup>
              <div>
                <strong>Tu ubicación</strong>
                <br />
                Lat: {userLocation.latitude.toFixed(6)}
                <br />
                Lng: {userLocation.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Ilo (si no estamos en la ubicación del usuario) */}
        {!isUserLocation && (
          <Marker
            position={[
              LocationService.ILO_DEFAULT_COORDS.latitude,
              LocationService.ILO_DEFAULT_COORDS.longitude
            ]}
          >
            <Popup>
              <div>
                <strong>Ilo, Perú</strong>
                <br />
                Centro de la ciudad
              </div>
            </Popup>
          </Marker>
        )}

        {/* Manejador de eventos del mapa */}
        <MapEventHandler onLocationSelect={onLocationSelect} />

        {/* Marcadores de reportes */}
        {reports.map((report) => {
          const isUserReport = currentUserId === report.userId;
          const categoryIcon = getReportTypeIcon(report.category);
          const statusText = {
            active: 'Activo',
            in_progress: 'En Progreso',
            resolved: 'Resuelto'
          };
          const priorityText = {
            low: '🟢 Baja',
            medium: '🟡 Media',
            high: '🔴 Alta'
          };

          // Safety check for location
          if (!report.location || typeof report.location.lat !== 'number' || typeof report.location.lng !== 'number') {
            console.warn('Reporte con ubicación inválida:', report);
            return null;
          }

          return (
            <Marker
              key={`report-${report.id}`}
              position={[report.location.lat, report.location.lng]}
              icon={createReportIcon(report, isUserReport)}
              eventHandlers={{
                click: () => {
                  if (onReportClick) {
                    onReportClick(report);
                  }
                }
              }}
            >
              <Popup>
                <div className="report-popup">
                  <div className="report-popup-header">
                    <h4>
                      {categoryIcon} {report.title}
                      {isUserReport && <span className="my-report-badge">👤 Mi reporte</span>}
                    </h4>
                    <div className={`status-badge ${report.status}`}>
                      {statusText[report.status]}
                    </div>
                  </div>

                  <div className="report-popup-content">
                    <p><strong>Descripción:</strong></p>
                    <p>{report.description}</p>

                    <div className="report-popup-meta">
                      <p><strong>Reportado por:</strong> {report.userName}</p>
                      <p><strong>Fecha:</strong> {formatDate(report.createdAt)}</p>
                      <p><strong>Prioridad:</strong> {priorityText[report.priority]}</p>
                      <p><strong>❤️ {report.likes} 💬 {report.comments}</strong></p>
                    </div>

                    {report.imageUrl && (
                      <div className="report-popup-photo">
                        <img
                          src={report.imageUrl}
                          alt="Foto del reporte"
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="report-popup-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => onReportClick && onReportClick(report)}
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcadores de posts */}
        {/* Marcadores de posts (con offset si hay reporte cercano) */}
        {posts.map((post) => {
          const isUserPost = currentUserId === post.userId;
          // Calcular posición con offset si hay un reporte cercano
          const offsetPosition = getMarkerOffset(post.location.lat, post.location.lng, reports);

          return (
            <Marker
              key={`post-${post.id}`}
              position={[offsetPosition.lat, offsetPosition.lng]}
              icon={createPostIcon(post, isUserPost)}
              eventHandlers={{
                click: () => {
                  if (onPostClick) {
                    onPostClick(post);
                  }
                }
              }}
            >
              <Popup>
                <div className="report-popup">
                  <div className="report-popup-header">
                    <h4>
                      📸 {post.userName}
                      {isUserPost && <span className="my-report-badge">👤 Mío</span>}
                    </h4>
                  </div>

                  <div className="report-popup-content">
                    <p>{post.content.description.substring(0, 100)}{post.content.description.length > 100 ? '...' : ''}</p>

                    {post.content.imageUrl && (
                      <div className="report-popup-photo">
                        <img
                          src={post.content.imageUrl}
                          alt="Post"
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px' }}
                        />
                      </div>
                    )}

                    <div className="report-popup-meta">
                      <p><strong>❤️ {post.interactions.likes} 💬 {post.interactions.comments}</strong></p>
                    </div>
                  </div>

                  <div className="report-popup-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => onPostClick && onPostClick(post)}
                    >
                      Ver Post
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {onLocationSelect && (
        <div className="map-instructions">
          <p>💡 Haz clic en el mapa para seleccionar una ubicación</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;