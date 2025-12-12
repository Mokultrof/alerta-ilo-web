/**
 * CreateReportModal - Modal para crear nuevos reportes comunitarios
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ReportCategory, CreateReportData, Report } from '../../types';
import { REPORT_TYPES, getAllReportTypes } from '../../config/reportTypes';
import { LocationService } from '../../services/LocationService';
import { StorageService } from '../../services/StorageService';
import { ReportsService } from '../../services/ReportsService';
import Button from '../ui/Button';
import './CreateReportModal.css';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated?: (report: Report | CreateReportData) => void;
  initialData?: Report;
  isEditing?: boolean;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onReportCreated,
  initialData,
  isEditing = false
}) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const reportTypes = getAllReportTypes();

  useEffect(() => {
    if (isOpen && initialData && isEditing) {
      setSelectedCategory(initialData.category);
      setTitle(initialData.title);
      setDescription(initialData.description);
      setLocation(initialData.location);
      setPriority(initialData.priority);
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
    } else if (isOpen && !isEditing) {
      resetForm();
    }
  }, [isOpen, initialData, isEditing]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Solo se permiten imágenes en formato JPG, PNG o WebP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB.');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const result = await LocationService.getLocationWithFallback();
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${result.location.latitude}&lon=${result.location.longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        setLocation({
          lat: result.location.latitude,
          lng: result.location.longitude,
          address: data.display_name || `${result.location.latitude.toFixed(4)}, ${result.location.longitude.toFixed(4)}`
        });
      } catch (error) {
        setLocation({
          lat: result.location.latitude,
          lng: result.location.longitude,
          address: `${result.location.latitude.toFixed(4)}, ${result.location.longitude.toFixed(4)}`
        });
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      alert('No se pudo obtener la ubicación. Usando ubicación por defecto.');
      setLocation({
        lat: LocationService.ILO_DEFAULT_COORDS.latitude,
        lng: LocationService.ILO_DEFAULT_COORDS.longitude,
        address: 'Ilo, Perú'
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      let imageUrl: string | undefined = initialData?.imageUrl;

      if (image && user) {
        setUploadingImage(true);
        try {
          imageUrl = await StorageService.uploadReportImage(image, user.uid);
        } catch (error: any) {
          console.error('❌ Error subiendo imagen:', error);
          alert('Error al subir la imagen. El reporte se guardará sin la nueva imagen.');
        } finally {
          setUploadingImage(false);
        }
      }

      if (isEditing && initialData && user) {
        const updatedReport = await ReportsService.updateReport(initialData.id, {
          category: selectedCategory!,
          title: title.trim(),
          description: description.trim(),
          priority,
          imageUrl
        }, user.uid);

        alert('¡Reporte actualizado exitosamente!');
        if (onReportCreated) {
          onReportCreated(updatedReport);
        }
      } else if (user && location && selectedCategory) {
        const reportData: CreateReportData = {
          category: selectedCategory,
          title: title.trim(),
          description: description.trim(),
          location: {
            lat: location.lat,
            lng: location.lng,
            address: location.address,
            placeName: location.address.split(',')[0]
          },
          imageUrl,
          priority
        };

        const newReport = await ReportsService.createReport(reportData, user.uid, user.displayName || 'Usuario', user.photoURL || undefined);
        console.log('✅ Reporte guardado en Firestore');

        if (onReportCreated) {
          onReportCreated(newReport);
        }
        alert('¡Reporte creado exitosamente!');
      }

      resetForm();
      onClose();

    } catch (error) {
      console.error('Error guardando reporte:', error);
      alert('Error al guardar el reporte. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setTitle('');
    setDescription('');
    setImage(null);
    setImagePreview(null);
    setLocation(null);
    setPriority('medium');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-report-modal-overlay" onClick={handleClose}>
      <div className="create-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-report-modal__header">
          <h2>{isEditing ? '✏️ Editar Reporte' : '🚨 Crear Reporte Comunitario'}</h2>
          <button
            className="create-report-modal__close"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-report-modal__form" style={{ marginBottom: 0 }}>
          {/* Selección de categoría con dropdown */}
          <div className="create-report-modal__field">
            <label className="create-report-modal__label">
              Tipo de Reporte *
            </label>
            <div className="category-selector">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
                className="category-select"
                required
              >
                <option value="">Selecciona un tipo de reporte</option>
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedCategory && (
              <div className="category-description">
                <div className="category-info">
                  <div className="category-header">
                    <span
                      className="category-color-indicator"
                      style={{ backgroundColor: REPORT_TYPES[selectedCategory].color }}
                    ></span>
                    <h4>
                      {REPORT_TYPES[selectedCategory].icon} {REPORT_TYPES[selectedCategory].name}
                    </h4>
                  </div>
                  <p>{REPORT_TYPES[selectedCategory].description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Título */}
          <div className="create-report-modal__field">
            <label className="create-report-modal__label">
              Título del Reporte *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Bache grande en Av. Moquegua"
              className="create-report-modal__input"
              maxLength={100}
              required
            />
            <div className="create-report-modal__char-count">
              {title.length}/100
            </div>
          </div>

          {/* Descripción */}
          <div className="create-report-modal__field">
            <label className="create-report-modal__label">
              Descripción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema con detalle..."
              className="create-report-modal__textarea"
              rows={4}
              maxLength={500}
              required
            />
            <div className="create-report-modal__char-count">
              {description.length}/500
            </div>
          </div>

          {/* Prioridad */}
          <div className="create-report-modal__field">
            <label className="create-report-modal__label">
              Prioridad
            </label>
            <div className="priority-options">
              {[
                { value: 'low', label: 'Baja', color: '#2ED573', icon: '🟢' },
                { value: 'medium', label: 'Media', color: '#FFA502', icon: '🟡' },
                { value: 'high', label: 'Alta', color: '#FF4757', icon: '🔴' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`priority-btn ${priority === option.value ? 'selected' : ''}`}
                  onClick={() => setPriority(option.value as 'low' | 'medium' | 'high')}
                  style={{
                    '--priority-color': option.color
                  } as React.CSSProperties}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Imagen */}
          <div className="create-report-modal__field">
            <label className="create-report-modal__label">
              Foto (Opcional)
            </label>
            <div className="create-report-modal__image-section">
              {imagePreview ? (
                <div className="create-report-modal__image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="create-report-modal__remove-image"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="create-report-modal__add-image"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <span className="add-image-icon">📷</span>
                  <span>{uploadingImage ? 'Subiendo...' : 'Agregar Foto'}</span>
                  <small>JPG, PNG, WebP - Máximo 5MB</small>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="create-report-modal__field">
            <label className="create-report-modal__label">
              Ubicación *
            </label>
            {location ? (
              <div className="create-report-modal__location">
                <span className="location-icon">📍</span>
                <span className="location-text">{location.address}</span>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setLocation(null)}
                    className="create-report-modal__remove-location"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                loading={gettingLocation}
                icon="📍"
                className="get-location-btn"
              >
                {gettingLocation ? 'Obteniendo ubicación...' : 'Obtener Mi Ubicación'}
              </Button>
            )}
          </div>

        </form>

        {/* Botones */}
        <div className="create-report-modal__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={loading || uploadingImage}
            disabled={!selectedCategory || !title.trim() || !description.trim() || !location}
            className="submit-report-btn"
            onClick={handleSubmit}
          >
            {uploadingImage ? 'Subiendo imagen...' : loading ? 'Guardando...' : (isEditing ? 'Actualizar Reporte' : 'Crear Reporte')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateReportModal;