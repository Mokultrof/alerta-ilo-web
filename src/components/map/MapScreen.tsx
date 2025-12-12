import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InteractiveMap from './MapContainer';
import CreateReportModal from '../reports/CreateReportModal';
import { LatLng, Report, CreateReportData, Post } from '../../types';
import { REPORT_TYPES, getAllReportTypes } from '../../config/reportTypes';
import { ReportsService } from '../../services/ReportsService';
import PostsService from '../../services/PostsService';
import { LocationService } from '../../services/LocationService';
import './Map.css';

const MapScreen: React.FC = () => {
  const { user } = useAuth();
  const [_selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const reportTypes = getAllReportTypes();

  // Cargar reportes al montar el componente
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Cargar reportes primero (prioridad)
      const allReports = await ReportsService.getAllReports();
      setReports(allReports);

      // Intentar cargar posts, pero no bloquear si falla (por permisos, etc.)
      try {
        const nearbyPosts = await PostsService.getInstance().getNearbyPosts({
          lat: LocationService.ILO_DEFAULT_COORDS.latitude,
          lng: LocationService.ILO_DEFAULT_COORDS.longitude,
          address: 'Ilo, Perú'
        }, 50); // 50km radius
        setPosts(nearbyPosts);
      } catch (postError) {
        console.warn('No se pudieron cargar los posts (posible error de permisos), pero los reportes están listos.', postError);
        // No hacemos nada más, permitimos que la UI muestre los reportes
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
      // Solo mostramos error si fallan los reportes, que es lo crítico
    } finally {
      setLoading(false);
    }
  };

  // Prevenir scroll del body cuando hay modales abiertos
  React.useEffect(() => {
    if (showCreateReport || showReportDetail) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showCreateReport, showReportDetail]);

  // Cerrar modales con tecla Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showReportDetail) {
          handleCloseReportDetail();
        } else if (showCreateReport) {
          handleCloseCreateReport();
        }
      }
    };

    if (showCreateReport || showReportDetail) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showCreateReport, showReportDetail]);

  const handleLocationSelect = (location: LatLng) => {
    setSelectedLocation(location);
    setShowCreateReport(true);
  };

  const handleCloseCreateReport = () => {
    setShowCreateReport(false);
    setSelectedLocation(null);
  };

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const handleCloseReportDetail = () => {
    setShowReportDetail(false);
    setSelectedReport(null);
  };

  const handleReportCreated = async (reportData: Report | CreateReportData) => {
    try {
      if (!user) return;

      // Si ya es un reporte completo (tiene ID), solo agregarlo al estado
      if ('id' in reportData) {
        setReports(prev => [reportData as Report, ...prev]);
        console.log('Nuevo reporte agregado al mapa:', reportData);
        return;
      }

      // Fallback para compatibilidad (aunque ya no debería usarse)
      const newReport = await ReportsService.createReport(
        reportData as CreateReportData,
        user.uid,
        user.displayName || 'Usuario'
      );

      // Agregar el nuevo reporte a la lista
      setReports(prev => [newReport, ...prev]);

      console.log('Nuevo reporte creado (fallback):', newReport);
    } catch (error) {
      console.error('Error creando reporte:', error);
      alert('Error al crear el reporte. Inténtalo de nuevo.');
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(report.category);
    const matchesSearch = searchTerm === '' ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="map-screen">
      <div className="map-content">
        <div className="map-section">
          {loading ? (
            <div className="map-loading-container">
              <div className="map-loading-spinner"></div>
              <p>Cargando reportes comunitarios...</p>
            </div>
          ) : (
            <InteractiveMap
              onLocationSelect={handleLocationSelect}
              reports={filteredReports}
              posts={posts}
              onReportClick={handleReportClick}
              onPostClick={(post) => console.log('Post clicked:', post)}
              currentUserId={user?.uid}
              className="main-map"
            />
          )}
        </div>

        <div className="map-sidebar">
          <div className="sidebar-section">
            <h3>🚨 Crear Reporte</h3>
            <p>
              Haz clic en cualquier lugar del mapa para reportar
              problemas o eventos en tu comunidad.
            </p>
            <button
              className="create-report-btn"
              onClick={() => setShowCreateReport(true)}
            >
              📝 Nuevo Reporte
            </button>
          </div>

          <div className="sidebar-section">
            <h3>🔍 Buscar Reportes</h3>
            <div className="search-section">
              <input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>📂 Filtrar por Tipo</h3>
            <div className="filter-options">
              {reportTypes.map((type) => (
                <label key={type.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(type.id)}
                    onChange={() => handleCategoryToggle(type.id)}
                  />
                  <span className="filter-icon">{type.icon}</span>
                  <span className="filter-name">{type.name}</span>
                  <span className="filter-count">
                    ({reports.filter(r => r.category === type.id).length})
                  </span>
                </label>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <button
                className="clear-filters-btn"
                onClick={() => setSelectedCategories([])}
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>📊 Estadísticas</h3>
              <button
                onClick={loadReports}
                className="refresh-btn"
                title="Recargar reportes"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                🔄
              </button>
            </div>
            <div className="stats-mini">
              <div className="stat-mini">
                <span className="stat-number">{reports.length}</span>
                <span className="stat-label">Reportes Totales</span>
              </div>
              <div className="stat-mini">
                <span className="stat-number">{reports.filter(r => r.userId === user?.uid).length}</span>
                <span className="stat-label">Mis Reportes</span>
              </div>
              <div className="stat-mini">
                <span className="stat-number">{reports.filter(r => r.status === 'active').length}</span>
                <span className="stat-label">Activos</span>
              </div>
            </div>
            {/* Debug Info (Only in dev) */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
                Reports: {reports.length} | Posts: {posts.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de crear reporte */}
      <CreateReportModal
        isOpen={showCreateReport}
        onClose={handleCloseCreateReport}
        onReportCreated={handleReportCreated}
      />

      {/* Modal de detalle del reporte */}
      {showReportDetail && selectedReport && (
        <div
          className="report-detail-overlay"
          onClick={handleCloseReportDetail}
        >
          <div
            className="report-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="report-detail-header">
              <h3>
                {REPORT_TYPES[selectedReport.category]?.icon} {selectedReport.title}
              </h3>
              <button
                className="close-btn"
                onClick={handleCloseReportDetail}
              >
                ✕
              </button>
            </div>

            <div className="report-detail-content">
              <div className="report-detail-category">
                <div
                  className={`category-badge ${selectedReport.category}`}
                  style={{ backgroundColor: REPORT_TYPES[selectedReport.category]?.color }}
                >
                  {REPORT_TYPES[selectedReport.category]?.name}
                </div>
                <div className={`status-badge ${selectedReport.status}`}>
                  {selectedReport.status === 'active' && 'Activo'}
                  {selectedReport.status === 'in_progress' && 'En Progreso'}
                  {selectedReport.status === 'resolved' && 'Resuelto'}
                </div>
              </div>

              <div className="report-detail-description">
                <h4>Descripción</h4>
                <p>{selectedReport.description}</p>
              </div>

              {selectedReport.imageUrl && (
                <div className="report-detail-photo">
                  <h4>Evidencia Fotográfica</h4>
                  <img
                    src={selectedReport.imageUrl}
                    alt="Foto del reporte"
                    className="report-photo-full"
                  />
                </div>
              )}

              <div className="report-detail-info">
                <div className="info-row">
                  <strong>Reportado por:</strong>
                  <span>{selectedReport.userName}</span>
                </div>
                <div className="info-row">
                  <strong>Ubicación:</strong>
                  <span>{selectedReport.location.address || `${selectedReport.location.lat.toFixed(6)}, ${selectedReport.location.lng.toFixed(6)}`}</span>
                </div>
                <div className="info-row">
                  <strong>Fecha:</strong>
                  <span>{new Intl.DateTimeFormat('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(selectedReport.createdAt)}</span>
                </div>
                <div className="info-row">
                  <strong>Prioridad:</strong>
                  <span className={`priority-${selectedReport.priority}`}>
                    {selectedReport.priority === 'low' && '🟢 Baja'}
                    {selectedReport.priority === 'medium' && '🟡 Media'}
                    {selectedReport.priority === 'high' && '🔴 Alta'}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Likes:</strong>
                  <span>❤️ {selectedReport.likes}</span>
                </div>
              </div>

              {selectedReport.userId === user?.uid && (
                <div className="report-detail-actions">
                  <button className="edit-report-btn">
                    ✏️ Editar
                  </button>
                  <button className="delete-report-btn">
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;