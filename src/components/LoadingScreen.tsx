import React from 'react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Alerta Ilo</h2>
        <p>Cargando aplicación...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;