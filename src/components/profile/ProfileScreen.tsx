import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, Report, Post } from '../../types';
import { ReportsService } from '../../services/ReportsService';
import PostsService from '../../services/PostsService';
import { usePosts } from '../../contexts/PostsContext';
import PostCard from '../feed/PostCard';
import CreatePostModal from '../feed/CreatePostModal';
import CreateReportModal from '../reports/CreateReportModal';
import AvatarUploader from '../ui/AvatarUploader';
import { getReportTypeIcon, getReportTypeName } from '../../config/reportTypes';
import './Profile.css';

const ProfileScreen: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { likePost, unlikePost } = usePosts();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<UserProfile>({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'posts'>('posts');
  const [stats, setStats] = useState({
    totalReports: 0,
    activeReports: 0,
    resolvedReports: 0,
    totalLikes: 0,
    totalPosts: 0,
    joinDate: user?.createdAt || new Date()
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten imágenes en formato JPG, PNG o WebP.');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen es muy grande. Máximo 5MB.');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.onerror = () => {
        setError('Error al leer el archivo de imagen.');
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (photoFile) {
      console.log('Uploading photo:', photoFile.name);
    }

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || '',
      photoURL: user?.photoURL || ''
    });
    setIsEditing(false);
    setError(null);
  };

  const [imageError, setImageError] = useState(false);

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      loadUserReports();
      loadUserPosts();
    }
  }, [user]);

  // Reset image error when photoURL changes
  useEffect(() => {
    setImageError(false);
  }, [user?.photoURL]);

  const loadUserReports = async () => {
    if (!user) return;

    try {
      setReportsLoading(true);
      const reports = await ReportsService.getReportsByUser(user.uid);
      setUserReports(reports);

      // Calcular estadísticas
      const totalLikes = reports.reduce((sum, report) => sum + report.likes, 0);
      const activeReports = reports.filter(r => r.status === 'active').length;
      const resolvedReports = reports.filter(r => r.status === 'resolved').length;

      setStats(prev => ({
        ...prev,
        totalReports: reports.length,
        activeReports,
        resolvedReports,
        totalLikes: prev.totalLikes + totalLikes, // Sumar likes de reportes
      }));
    } catch (error) {
      console.error('Error cargando reportes del usuario:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const loadUserPosts = async () => {
    if (!user) return;

    try {
      setPostsLoading(true);
      try {
        const posts = await PostsService.getInstance().getUserPosts(user.uid);

        // Validar y filtrar posts con estructura válida
        const validPosts = posts.filter(post => {
          const isValid = post && post.content && typeof post.content.description === 'string';
          if (!isValid) {
            console.warn('Post con estructura inválida:', post);
          }
          return isValid;
        });

        console.log(`📸 Posts cargados: ${validPosts.length} de ${posts.length}`);
        setUserPosts(validPosts);

        const postsLikes = validPosts.reduce((sum, post) => sum + (post.interactions?.likes || 0), 0);

        setStats(prev => ({
          ...prev,
          totalPosts: validPosts.length,
          totalLikes: prev.totalLikes + postsLikes
        }));
      } catch (postError: any) {
        if (postError?.code === 'permission-denied' || postError?.message?.includes('permission')) {
          console.warn('No se pudieron cargar los posts (permisos insuficientes).');
        } else {
          console.error('Error cargando posts del usuario:', postError);
        }
        setUserPosts([]);
      }
    } finally {
      setPostsLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string, imageUrl?: string) => {
    if (!user) return;

    if (window.confirm('¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.')) {
      try {
        await ReportsService.deleteReport(reportId, user.uid, imageUrl);
        // Recargar reportes
        loadUserReports();
      } catch (error) {
        console.error('Error eliminando reporte:', error);
        alert('No se pudo eliminar el reporte.');
      }
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
  };

  const handleReportUpdated = () => {
    setEditingReport(null);
    loadUserReports();
  };

  const handleLikeReport = async (report: Report) => {
    if (!user) return;
    try {
      const isLiked = report.likedBy.includes(user.uid);
      if (isLiked) {
        await ReportsService.unlikeReport(report.id, user.uid);
      } else {
        await ReportsService.likeReport(report.id, user.uid);
      }
      loadUserReports(); // Recargar para actualizar likes
    } catch (error) {
      console.error('Error al dar like al reporte:', error);
    }
  };

  if (!user) {
    return <div>Cargando perfil...</div>;
  }

  return (
    <div className="profile-screen">
      {/* Header con gradiente */}
      <div className="profile-header-banner">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container" onClick={() => setShowAvatarUploader(true)} style={{ cursor: 'pointer' }}>
              {user.photoURL && !imageError ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="profile-avatar-img"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="avatar-placeholder">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="avatar-status-indicator"></div>
              <div className="avatar-edit-overlay">
                <span>📷</span>
              </div>
            </div>
            <div className="profile-basic-info">
              <h1 className="profile-name">{user.displayName}</h1>
              <p className="profile-email">{user.email}</p>
              <div className="profile-badges">
                <span className="badge verified">✓ Verificado</span>
                <span className="badge member-since">
                  📅 Miembro desde {stats.joinDate.toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button
              onClick={() => setIsEditing(true)}
              className="edit-profile-btn"
            >
              <span className="btn-icon">✏️</span>
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <div className="profile-container">
        {/* Estadísticas principales */}
        <div className="profile-stats-section">
          <div className="stats-grid-modern">
            <div className="stat-card-modern primary">
              <div className="stat-icon">📸</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalPosts}</div>
                <div className="stat-label">Momentos</div>
              </div>
            </div>
            <div className="stat-card-modern info">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalReports}</div>
                <div className="stat-label">Reportes</div>
              </div>
            </div>
            <div className="stat-card-modern success">
              <div className="stat-icon">❤️</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalLikes}</div>
                <div className="stat-label">Likes</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            📸 Mis Momentos
          </button>
          <button
            className={`profile-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            🚨 Mis Reportes
          </button>
        </div>

        <div className="profile-content-grid">
          {activeTab === 'posts' ? (
            /* Sección de Posts */
            <div className="profile-posts-section">
              {postsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando momentos...</p>
                </div>
              ) : userPosts.length > 0 ? (
                <div className="profile-posts-grid">
                  {userPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user.uid}
                      onLike={() => likePost(post.id)}
                      onUnlike={() => unlikePost(post.id)}
                      onComment={() => { }}
                      onShare={() => { }}
                      onUserClick={() => { }}
                      onLocationClick={() => { }}
                    />
                  ))}
                  <button
                    className="create-post-floating-btn"
                    onClick={() => setIsCreatingPost(true)}
                    title="Crear nuevo momento"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📸</div>
                  <h3>¡Aún no has compartido momentos!</h3>
                  <p>Comparte tus experiencias y lugares favoritos de Ilo.</p>
                  <button
                    className="create-first-report-btn"
                    onClick={() => setIsCreatingPost(true)}
                  >
                    Crear Mi Primer Momento
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sección de Reportes */
            <div className="profile-reports-section">
              <div className="section-header">
                <h2>🚨 Mis Reportes Recientes</h2>
                <span className="section-count">{userReports.length}</span>
              </div>

              {reportsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando reportes...</p>
                </div>
              ) : userReports.length > 0 ? (
                <div className="reports-grid">
                  {userReports.map((report) => (
                    <div key={report.id} className="report-card">
                      <div className="report-card-header">
                        <div className="report-category">
                          <span className="category-icon">
                            {getReportTypeIcon(report.category)}
                          </span>
                          <span className="category-name">
                            {getReportTypeName(report.category)}
                          </span>
                        </div>
                        <div className={`report-status ${report.status}`}>
                          {report.status === 'active' && 'Activo'}
                          {report.status === 'in_progress' && 'En Progreso'}
                          {report.status === 'resolved' && 'Resuelto'}
                        </div>
                      </div>

                      <div className="report-card-content">
                        <h3 className="report-title">{report.title}</h3>
                        <p className="report-description">
                          {report.description.length > 100
                            ? `${report.description.substring(0, 100)}...`
                            : report.description
                          }
                        </p>

                        {report.imageUrl && (
                          <div className="report-image-preview" style={{ height: '180px', width: '100%', overflow: 'hidden', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#f3f4f6' }}>
                            <img
                              src={report.imageUrl}
                              alt={report.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                        )}

                        <div className="report-meta">
                          <span className="report-date">
                            📅 {report.createdAt.toLocaleDateString('es-ES')}
                          </span>
                          <button
                            className={`report-like-btn ${report.likedBy.includes(user.uid) ? 'liked' : ''}`}
                            onClick={() => handleLikeReport(report)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: report.likedBy.includes(user.uid) ? '#ef4444' : '#718096' }}
                          >
                            {report.likedBy.includes(user.uid) ? '❤️' : '🤍'} {report.likes}
                          </button>
                        </div>

                        <div className="report-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditReport(report)}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4a5568' }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteReport(report.id, report.imageUrl)}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #fed7d7', background: '#fff5f5', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#c53030' }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>¡Aún no has creado reportes!</h3>
                  <p>Comparte problemas o eventos de tu comunidad para ayudar a mejorar Ilo.</p>
                  <button className="create-first-report-btn">
                    Crear Mi Primer Reporte
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Panel de información adicional */}
          <div className="profile-info-panel">
            <div className="info-card">
              <h3>🏆 Logros</h3>
              <div className="achievements">
                {stats.totalReports >= 1 && (
                  <div className="achievement">
                    <span className="achievement-icon">🎯</span>
                    <span>Primer Reporte</span>
                  </div>
                )}
                {stats.totalReports >= 5 && (
                  <div className="achievement">
                    <span className="achievement-icon">🌟</span>
                    <span>Reportero Activo</span>
                  </div>
                )}
                {stats.totalLikes >= 10 && (
                  <div className="achievement">
                    <span className="achievement-icon">💖</span>
                    <span>Popular</span>
                  </div>
                )}
                {stats.resolvedReports >= 3 && (
                  <div className="achievement">
                    <span className="achievement-icon">✨</span>
                    <span>Solucionador</span>
                  </div>
                )}
              </div>
            </div>

            <div className="info-card">
              <h3>📍 Mi Actividad en Ilo</h3>
              <div className="activity-stats">
                <div className="activity-item">
                  <span className="activity-label">Zona más reportada:</span>
                  <span className="activity-value">Centro de Ilo</span>
                </div>
                <div className="activity-item">
                  <span className="activity-label">Categoría favorita:</span>
                  <span className="activity-value">Infraestructura</span>
                </div>
                <div className="activity-item">
                  <span className="activity-label">Impacto comunitario:</span>
                  <span className="activity-value">Alto</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición de perfil */}
      {isEditing && (
        <div className="edit-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>✏️ Editar Perfil</h2>
              <button
                className="close-modal-btn"
                onClick={() => setIsEditing(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group-modern">
                <label htmlFor="displayName">Nombre Completo</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  minLength={2}
                  maxLength={50}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="form-group-modern">
                <label>Foto de Perfil (opcional)</label>
                <div className="photo-upload-section">
                  {photoPreview ? (
                    <div className="photo-preview-container">
                      <img src={photoPreview} alt="Preview" className="photo-preview" />
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      >
                        ✕ Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <label className="photo-upload-btn">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                      <span className="upload-icon">📷</span>
                      <span className="upload-text">Seleccionar Foto</span>
                      <small>JPG, PNG, WebP - Máximo 5MB</small>
                    </label>
                  )}
                </div>
              </div>

              {error && (
                <div className="error-message-modern">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <div className="form-actions-modern">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-btn-modern"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="save-btn-modern"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edición de reporte */}
      <CreateReportModal
        isOpen={!!editingReport}
        onClose={() => setEditingReport(null)}
        onReportCreated={handleReportUpdated}
        initialData={editingReport || undefined}
        isEditing={true}
      />

      {/* Modal de creación de post */}
      {isCreatingPost && (
        <CreatePostModal
          isOpen={isCreatingPost}
          onClose={() => setIsCreatingPost(false)}
          onPostCreated={() => {
            setIsCreatingPost(false);
            loadUserPosts();
          }}
        />
      )}

      {/* Modal de cambio de avatar */}
      {showAvatarUploader && (
        <AvatarUploader
          currentAvatar={user.photoURL}
          onAvatarUpdated={(_newUrl) => {
            setImageError(false);
          }}
          onClose={() => setShowAvatarUploader(false)}
        />
      )}
    </div>
  );
};

export default ProfileScreen;