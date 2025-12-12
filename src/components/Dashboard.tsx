import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AriaUtils } from '../utils/accessibility';

import { ReportsService } from '../services/ReportsService';
import { getAllReportTypes } from '../config/reportTypes';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const mainRef = useRef<HTMLElement>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Focus on main content when component mounts
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus();
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const reportsStats = await ReportsService.getReportsStats();
      setStats(reportsStats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const titleId = AriaUtils.generateId('dashboard-title');
  const reportTypes = getAllReportTypes();

  return (
    <div className="dashboard alerta-ilo-dashboard">
      <main
        className="dashboard-main"
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        role="main"
        aria-labelledby={titleId}
      >
        <div className="dashboard-hero">
          <div className="hero-content">
            <h1 id={titleId} className="hero-title">
              🚨 Bienvenido a Alerta Ilo
            </h1>
            <p className="hero-subtitle">
              Plataforma de reportes comunitarios para mejorar nuestra ciudad
            </p>
            <div className="hero-actions">
              <Link to="/map" className="hero-btn primary">
                🗺️ Ver Mapa de Reportes
              </Link>
              <Link to="/map" className="hero-btn secondary">
                📝 Crear Nuevo Reporte
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="dashboard-content">
            <div className="stats-section">
              <h2>📊 Estadísticas de la Comunidad</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <span className="stat-number">{stats?.total || 0}</span>
                    <span className="stat-label">Reportes Totales</span>
                  </div>
                </div>
                <div className="stat-card active">
                  <div className="stat-icon">🔴</div>
                  <div className="stat-info">
                    <span className="stat-number">{stats?.active || 0}</span>
                    <span className="stat-label">Activos</span>
                  </div>
                </div>
                <div className="stat-card progress">
                  <div className="stat-icon">🟡</div>
                  <div className="stat-info">
                    <span className="stat-number">{stats?.inProgress || 0}</span>
                    <span className="stat-label">En Progreso</span>
                  </div>
                </div>
                <div className="stat-card resolved">
                  <div className="stat-icon">🟢</div>
                  <div className="stat-info">
                    <span className="stat-number">{stats?.resolved || 0}</span>
                    <span className="stat-label">Resueltos</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="categories-section">
              <h2>📂 Tipos de Reportes</h2>
              <div className="categories-grid">
                {reportTypes.map((type) => (
                  <div key={type.id} className="category-card">
                    <div className="category-header">
                      <span className="category-icon">{type.icon}</span>
                      <h3>{type.name}</h3>
                      <span className="category-count">
                        {stats?.byCategory[type.id] || 0}
                      </span>
                    </div>
                    <p className="category-description">{type.description}</p>
                    <div className="category-examples">
                      <strong>Ejemplos:</strong>
                      <ul>
                        {type.examples.slice(0, 2).map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="quick-actions">
              <h2>⚡ Acciones Rapidas</h2>
              <div className="actions-grid">
                <Link to="/map" className="action-card">
                  <div className="action-icon">🗺️</div>
                  <h3>Ver Mapa</h3>
                  <p>Explora todos los reportes en el mapa interactivo de Ilo</p>
                </Link>
                <Link to="/map" className="action-card">
                  <div className="action-icon">📝</div>
                  <h3>Crear Reporte</h3>
                  <p>Reporta un problema o evento en tu comunidad</p>
                </Link>
                <Link to="/profile" className="action-card">
                  <div className="action-icon">👤</div>
                  <h3>Mi Perfil</h3>
                  <p>Ve tus reportes y actividad en la plataforma</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div aria-live="polite" aria-atomic="true" className="sr-only" />
      </main>
    </div>
  );
};

export default Dashboard;