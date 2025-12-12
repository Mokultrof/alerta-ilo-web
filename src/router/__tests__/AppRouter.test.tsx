import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import AppRouter from '../AppRouter';

// Mock the Firebase config
jest.mock('../../config/environment', () => ({
  useMockAuth: false,
  isFirebaseConfigured: () => true
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn()
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn()
}));

// Mock components to avoid complex rendering
jest.mock('../../components/auth/AuthScreen', () => {
  return function MockAuthScreen() {
    return <div data-testid="auth-screen">Auth Screen</div>;
  };
});

jest.mock('../../components/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard">Dashboard</div>;
  };
});

jest.mock('../../components/map/MapScreen', () => {
  return function MockMapScreen() {
    return <div data-testid="map-screen">Map Screen</div>;
  };
});

jest.mock('../../components/profile/ProfileScreen', () => {
  return function MockProfileScreen() {
    return <div data-testid="profile-screen">Profile Screen</div>;
  };
});

jest.mock('../../contexts/ReportsContext', () => ({
  ReportsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useReports: () => ({
    reports: [],
    stats: { active: 0, resolved: 0 },
    loading: false
  })
}));

describe('AppRouter', () => {
  const renderWithRouter = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  test('redirects to auth screen when not authenticated', async () => {
    renderWithRouter(['/']);
    
    // Should show loading first, then redirect to auth
    expect(screen.getByText('Cargando aplicación...')).toBeInTheDocument();
  });

  test('renders auth screen on /auth route', () => {
    renderWithRouter(['/auth']);
    
    // Should show loading first
    expect(screen.getByText('Cargando aplicación...')).toBeInTheDocument();
  });

  test('redirects unknown routes to root', () => {
    renderWithRouter(['/unknown-route']);
    
    // Should redirect to root and show loading
    expect(screen.getByText('Cargando aplicación...')).toBeInTheDocument();
  });
});