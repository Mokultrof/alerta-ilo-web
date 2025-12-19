/**
 * CreatePostModal - Modal para crear nuevos posts
 */

import React, { useState, useRef } from 'react';
import { usePosts } from '../../contexts/PostsContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { StorageService } from '../../services/StorageService';
import './CreatePostModal.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { createPost } = usePosts();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            // Usar geocoding reverso simple
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            setLocation({
              lat,
              lng,
              address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            });
          } catch (error) {
            // Si falla el geocoding, usar coordenadas
            setLocation({
              lat,
              lng,
              address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            });
          }

          setGettingLocation(false);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          // Usar ubicación por defecto (Ilo, Perú)
          setLocation({
            lat: -17.6397,
            lng: -71.3378,
            address: 'Ilo, Perú'
          });
          setGettingLocation(false);
        }
      );
    } else {
      // Usar ubicación por defecto
      setLocation({
        lat: -17.6397,
        lng: -71.3378,
        address: 'Ilo, Perú'
      });
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !location || !user) {
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | undefined;

      if (image) {
        try {
          imageUrl = await StorageService.uploadReportImageWithCompression(image, user.uid);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Optionally show an error to the user here
          setLoading(false);
          return;
        }
      }

      const postContent: any = {
        description: description.trim()
      };

      if (imageUrl) {
        postContent.imageUrl = imageUrl;
      }

      await createPost({
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          placeName: location.address.split(',')[0]
        },
        content: postContent,
        visibility: 'public'
      });

      // Limpiar formulario
      setDescription('');
      setImage(null);
      setImagePreview(null);
      setLocation(null);

      if (onPostCreated) {
        onPostCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creando post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-post-modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <Card padding="lg">
          <div className="create-post-modal__header">
            <h2>Crear Post</h2>
            <button
              className="create-post-modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="create-post-modal__form">
            {/* Imagen */}
            <div className="create-post-modal__image-section">
              {imagePreview ? (
                <div className="create-post-modal__image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="create-post-modal__remove-image"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="create-post-modal__add-image"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  <span>Agregar Imagen</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Descripción */}
            <div className="create-post-modal__field">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué está pasando?"
                className="create-post-modal__textarea"
                rows={4}
                maxLength={500}
                required
              />
              <div className="create-post-modal__char-count">
                {description.length}/500
              </div>
            </div>

            {/* Ubicación */}
            <div className="create-post-modal__field">
              {location ? (
                <div className="create-post-modal__location">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>{location.address}</span>
                  <button
                    type="button"
                    onClick={() => setLocation(null)}
                    className="create-post-modal__remove-location"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  loading={gettingLocation}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  }
                >
                  {gettingLocation ? 'Obteniendo ubicación...' : 'Agregar Ubicación'}
                </Button>
              )}
            </div>

            {/* Botones */}
            <div className="create-post-modal__actions">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!description.trim() || !location}
              >
                Publicar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreatePostModal;