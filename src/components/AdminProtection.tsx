import React from 'react';
import { useAuth } from '../stores/auth';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface AdminProtectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

const AdminProtection: React.FC<AdminProtectionProps> = ({ 
  children, 
  fallback,
  requiredRole = 'admin'
}) => {
  const { user } = useAuth();

  const isAuthorized = () => {
    if (!user) return false;
    
    // Vérifier si l'utilisateur est admin
    const isAdmin = user.is_admin || user.user_type === 'admin';
    
    if (requiredRole === 'admin' && isAdmin) {
      return true;
    }
    
    // Vérifier si l'utilisateur est super admin
    const isSuperAdmin = user.user_type === 'super_admin';
    
    if (requiredRole === 'super_admin' && isSuperAdmin) {
      return true;
    }
    
    return false;
  };

  if (!isAuthorized()) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ShieldExclamationIcon className="h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Accès restreint
        </h3>
        <p className="text-gray-400 max-w-md">
          Cette fonctionnalité est réservée aux administrateurs. 
          Contactez votre administrateur système si vous pensez avoir besoin d'accès.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtection;
