import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-icon">🚧</div>
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Página no encontrada</h2>
                <p className="not-found-description">
                    Lo sentimos, la página que buscas no existe o fue movida.
                </p>
                <div className="not-found-actions">
                    <Link to="/dashboard" className="not-found-btn primary">
                        🏠 Ir al Inicio
                    </Link>
                    <Link to="/map" className="not-found-btn secondary">
                        🗺️ Ver Mapa
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
