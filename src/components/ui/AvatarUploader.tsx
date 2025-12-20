import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AvatarUploader.css';

interface AvatarUploaderProps {
    currentAvatar?: string;
    onAvatarUpdated: (newUrl: string) => void;
    onClose: () => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
    currentAvatar,
    onAvatarUpdated,
    onClose
}) => {
    const { user, updateProfile } = useAuth();
    const [preview, setPreview] = useState<string | null>(currentAvatar || null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validar tipo
        if (!selectedFile.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen');
            return;
        }

        // Validar tamaño (max 2MB)
        if (selectedFile.size > 2 * 1024 * 1024) {
            setError('La imagen debe ser menor a 2MB');
            return;
        }

        setFile(selectedFile);
        setError('');

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploading(true);
        setError('');

        try {
            const storage = getStorage();
            const avatarRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);

            await uploadBytes(avatarRef, file);
            const downloadURL = await getDownloadURL(avatarRef);

            // Actualizar perfil del usuario
            await updateProfile({ photoURL: downloadURL });

            onAvatarUpdated(downloadURL);
            onClose();
        } catch (err: any) {
            console.error('Error al subir avatar:', err);
            setError('No se pudo subir la imagen. Intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="avatar-uploader-overlay" onClick={onClose}>
            <div className="avatar-uploader-modal" onClick={(e) => e.stopPropagation()}>
                <div className="avatar-uploader-header">
                    <h3>📷 Actualizar foto de perfil</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="avatar-uploader-content">
                    <div className="avatar-preview-container">
                        {preview ? (
                            <img src={preview} alt="Preview" className="avatar-preview" />
                        ) : (
                            <div className="avatar-placeholder-large">
                                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    <div className="avatar-actions">
                        <button
                            type="button"
                            className="select-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            📁 Seleccionar imagen
                        </button>

                        {file && (
                            <button
                                type="button"
                                className="upload-btn"
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? 'Subiendo...' : '✓ Guardar'}
                            </button>
                        )}
                    </div>

                    <p className="upload-hint">
                        Formatos: JPG, PNG, GIF • Máximo 2MB
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AvatarUploader;
