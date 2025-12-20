import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="alerta-ilo-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <span className="footer-logo">🚨</span>
                    <span className="footer-title">Alerta Ilo</span>
                </div>

                <div className="footer-info">
                    <p className="footer-description">
                        Plataforma de reportes comunitarios para mejorar nuestra ciudad
                    </p>
                    <p className="footer-location">
                        📍 Ilo, Moquegua - Perú
                    </p>
                </div>

                <div className="footer-links">
                    <a href="mailto:alertailo@municipalidad.gob.pe" className="footer-link">
                        ✉️ Contacto
                    </a>
                    <span className="footer-separator">•</span>
                    <span className="footer-version">v1.0.0</span>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {currentYear} Alerta Ilo - Todos los derechos reservados</p>
                <p className="footer-credits">
                    Desarrollado con ❤️ para la comunidad de Ilo
                </p>
            </div>
        </footer>
    );
};

export default Footer;
