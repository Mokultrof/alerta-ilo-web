/**
 * Configuración de tipos de reportes para Alerta Ilo
 * Categorías específicas para la ciudad de Ilo, Perú
 */

import { ReportType, ReportCategory } from '../types';

export const REPORT_TYPES: Record<ReportCategory, ReportType> = {
  infrastructure: {
    id: 'infrastructure',
    name: 'Infraestructura',
    icon: '🚧',
    color: '#f97316', // Naranja suave
    description: 'Problemas con calles, veredas, puentes y construcciones',
    examples: [
      'Baches en la vía',
      'Veredas rotas',
      'Semáforos dañados',
      'Puentes en mal estado',
      'Obras abandonadas'
    ]
  },
  utilities: {
    id: 'utilities',
    name: 'Servicios Públicos',
    icon: '⚡',
    color: '#3b82f6', // Azul suave
    description: 'Problemas con agua, luz, internet y otros servicios',
    examples: [
      'Corte de agua',
      'Falta de luz',
      'Internet lento',
      'Alcantarillado tapado',
      'Recolección de basura'
    ]
  },
  safety: {
    id: 'safety',
    name: 'Seguridad',
    icon: '🚨',
    color: '#ef4444', // Rojo suave
    description: 'Situaciones de riesgo, accidentes y seguridad ciudadana',
    examples: [
      'Accidentes de tránsito',
      'Robos o asaltos',
      'Peleas callejeras',
      'Zonas peligrosas',
      'Emergencias médicas'
    ]
  },
  environment: {
    id: 'environment',
    name: 'Medio Ambiente',
    icon: '🌱',
    color: '#10b981', // Verde suave
    description: 'Problemas ambientales y de limpieza urbana',
    examples: [
      'Basura acumulada',
      'Contaminación del aire',
      'Playas sucias',
      'Animales abandonados',
      'Áreas verdes descuidadas'
    ]
  },
  events: {
    id: 'events',
    name: 'Eventos Comunitarios',
    icon: '🎉',
    color: '#8b5cf6', // Púrpura suave
    description: 'Actividades, celebraciones y eventos locales',
    examples: [
      'Festivales locales',
      'Reuniones vecinales',
      'Actividades deportivas',
      'Conciertos al aire libre',
      'Ferias gastronómicas'
    ]
  },
  other: {
    id: 'other',
    name: 'Otros',
    icon: '📝',
    color: '#6b7280', // Gris suave
    description: 'Otros temas de interés comunitario',
    examples: [
      'Consultas generales',
      'Sugerencias',
      'Información útil',
      'Avisos importantes',
      'Temas varios'
    ]
  }
};

export const getReportTypeById = (id: ReportCategory): ReportType => {
  return REPORT_TYPES[id];
};

export const getAllReportTypes = (): ReportType[] => {
  return Object.values(REPORT_TYPES);
};

export const getReportTypeColor = (category: ReportCategory): string => {
  return REPORT_TYPES[category]?.color || '#747D8C';
};

export const getReportTypeIcon = (category: ReportCategory): string => {
  return REPORT_TYPES[category]?.icon || '📝';
};

export const getReportTypeName = (category: ReportCategory): string => {
  return REPORT_TYPES[category]?.name || 'Desconocido';
};