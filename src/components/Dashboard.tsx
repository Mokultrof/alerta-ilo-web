import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AriaUtils } from '../utils/accessibility';
import { ReportsService } from '../services/ReportsService';
import PostsService from '../services/PostsService';
import { LocationService } from '../services/LocationService';
import { getAllReportTypes } from '../config/reportTypes';
import { Post } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus();
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const reportsStats = await ReportsService.getReportsStats();
      setStats(reportsStats);

      try {
        const posts = await PostsService.getInstance().getNearbyPosts({
          lat: LocationService.ILO_DEFAULT_COORDS.latitude,
          lng: LocationService.ILO_DEFAULT_COORDS.longitude,
          address: 'Ilo, Perú'
        }, 100, 6);
        setRecentPosts(posts);
      } catch (_postError) {
        // Silent fail for posts
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const titleId = AriaUtils.generateId('dashboard-title');
  const reportTypes = getAllReportTypes();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="modern-dashboard">
      <main
        ref={mainRef}
        tabIndex={-1}
        role="main"
        aria-labelledby={titleId}
      >
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-content">
            <p className="hero-greeting">{getGreeting()}, {user?.displayName?.split(' ')[0] || 'Usuario'}</p>
            <h1 id={titleId} className="hero-title">
              ¿Qué está pasando en Ilo?
            </h1>
            <p className="hero-subtitle">
              Mantente informado sobre los reportes de tu comunidad y ayuda a mejorar nuestra ciudad.
            </p>
            <div className="hero-actions">
              <Link to="/map" className="hero-btn primary">
                🗺️ Explorar Mapa
              </Link>
              <Link to="/map?action=report" className="hero-btn secondary">
                ➕ Nuevo Reporte
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="skeleton" style={{ width: '100%', height: '200px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '60%', height: '24px' }} />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="section-header">
              <h2 className="section-title">📊 Estadísticas</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card" style={{ '--stat-color': 'var(--accent-gradient)', '--stat-bg': 'rgba(255, 107, 107, 0.1)' } as React.CSSProperties}>
                <div className="stat-icon">📋</div>
                <div className="stat-value">{stats?.total || 0}</div>
                <div className="stat-label">Reportes Totales</div>
              </div>
              <div className="stat-card" style={{ '--stat-color': 'var(--color-danger)', '--stat-bg': 'rgba(255, 71, 87, 0.1)' } as React.CSSProperties}>
                <div className="stat-icon">🔴</div>
                <div className="stat-value">{stats?.active || 0}</div>
                <div className="stat-label">Activos</div>
                <span className="stat-change positive">Requieren atención</span>
              </div>
              <div className="stat-card" style={{ '--stat-color': 'var(--color-warning)', '--stat-bg': 'rgba(255, 165, 2, 0.1)' } as React.CSSProperties}>
                <div className="stat-icon">🟡</div>
                <div className="stat-value">{stats?.inProgress || 0}</div>
                <div className="stat-label">En Progreso</div>
              </div>
              <div className="stat-card" style={{ '--stat-color': 'var(--color-success)', '--stat-bg': 'rgba(46, 213, 115, 0.1)' } as React.CSSProperties}>
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats?.resolved || 0}</div>
                <div className="stat-label">Resueltos</div>
                <span className="stat-change positive">+{Math.round((stats?.resolved / (stats?.total || 1)) * 100)}%</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="section-header">
                <h2 className="section-title">⚡ Acciones Rápidas</h2>
              </div>
              <div className="actions-grid">
                <Link to="/map" className="action-card">
                  <div className="action-icon">🗺️</div>
                  <div className="action-content">
                    <h3>Ver Mapa Interactivo</h3>
                    <p>Explora todos los reportes en tiempo real</p>
                  </div>
                </Link>
                <Link to="/map?action=report" className="action-card">
                  <div className="action-icon" style={{ background: 'var(--gradient-fire)' }}>📝</div>
                  <div className="action-content">
                    <h3>Crear Nuevo Reporte</h3>
                    <p>Reporta un problema o evento en tu zona</p>
                  </div>
                </Link>
                <Link to="/profile" className="action-card">
                  <div className="action-icon" style={{ background: 'var(--gradient-ocean)' }}>👤</div>
                  <div className="action-content">
                    <h3>Mi Perfil</h3>
                    <p>Gestiona tus reportes y actividad</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div className="categories-section">
              <div className="section-header">
                <h2 className="section-title">📂 Categorías</h2>
                <Link to="/map" className="section-link">Ver todas →</Link>
              </div>
              <div className="categories-grid">
                {reportTypes.map((type) => (
                  <Link to={`/map?category=${type.id}`} key={type.id} className="category-card">
                    <div className="category-icon">{type.icon}</div>
                    <div className="category-name">{type.name}</div>
                    <div className="category-count">{stats?.byCategory?.[type.id] || 0} reportes</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Moments */}
            {recentPosts.length > 0 && (
              <div className="moments-section">
                <div className="section-header">
                  <h2 className="section-title">📸 Momentos Recientes</h2>
                  <Link to="/profile" className="section-link">Ver más →</Link>
                </div>
                <div className="moments-grid">
                  {recentPosts.slice(0, 6).map((post) => (
                    <div key={post.id} className="moment-card">
                      {post.content.imageUrl ? (
                        <img src={post.content.imageUrl} alt={post.content.description} />
                      ) : (
                        <div className="moment-placeholder">📸</div>
                      )}
                      <div className="moment-overlay">
                        <span className="moment-user">@{post.userName}</span>
                        <span className="moment-likes">❤️ {post.interactions.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;