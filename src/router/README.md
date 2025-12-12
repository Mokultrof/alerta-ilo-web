# Routing System - Alerta Ilo

## Overview

This directory contains the routing configuration for the Alerta Ilo application using React Router v6.

## Components

### AppRouter.tsx
Main router component that handles all application routing with:
- **Protected Routes**: Routes that require authentication (`/dashboard`, `/map`, `/profile`)
- **Public Routes**: Routes for non-authenticated users (`/auth`)
- **Route Guards**: Automatic redirects based on authentication state
- **Navigation Guards**: Prevents access to protected routes without authentication

### Navigation.tsx
Global navigation component that provides:
- Navigation links between main sections
- User information display
- Sign out functionality
- Active route highlighting

### Layout.tsx
Layout wrapper component that:
- Provides consistent page structure
- Conditionally shows navigation
- Manages main content area

## Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | RootRedirect | Public | Redirects to `/dashboard` if authenticated, `/auth` if not |
| `/auth` | AuthScreen | Public Only | Login and registration |
| `/dashboard` | Dashboard | Protected | Main dashboard with app overview |
| `/map` | MapScreen | Protected | Interactive map with reports |
| `/profile` | ProfileScreen | Protected | User profile management |
| `/*` | Navigate | Any | Catch-all that redirects to `/` |

## Features

### Route Protection
- **ProtectedRoute**: Wrapper that ensures user is authenticated
- **PublicRoute**: Wrapper that redirects authenticated users away from auth pages
- **Loading States**: Shows loading screen during authentication checks

### Navigation Guards
- Automatic redirects based on authentication state
- Prevents manual URL navigation to unauthorized routes
- Maintains intended destination after login

### Layout Management
- Consistent navigation across protected routes
- No navigation on authentication pages
- Responsive design support

## Usage

The routing system is automatically initialized in `App.tsx`:

```tsx
import AppRouter from './router/AppRouter';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppRouter />
      </div>
    </AuthProvider>
  );
}
```

### Navigation Between Routes

Use React Router hooks in components:

```tsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const goToMap = () => {
    navigate('/map');
  };
  
  return <button onClick={goToMap}>Go to Map</button>;
};
```

### Route Parameters and State

For future expansion, routes can include parameters:

```tsx
// Example for future report detail route
<Route path="/report/:id" element={<ReportDetail />} />
```

## Security

- All protected routes require valid authentication
- Authentication state is checked on every route change
- Automatic logout redirects to authentication page
- No sensitive data exposed in public routes

## Performance

- Lazy loading ready (can be added with React.lazy)
- Minimal re-renders with proper route guards
- Efficient navigation state management