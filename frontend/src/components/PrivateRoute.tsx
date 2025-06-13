import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  logged: boolean;
  currentUser: { role: string } | null; // accepte null
  allowedRoles: string[];
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  logged,
  currentUser,
  allowedRoles = [],
}) => {
  if (!logged) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && (!currentUser || !allowedRoles.includes(currentUser.role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
