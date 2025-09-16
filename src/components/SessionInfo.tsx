import { useState, useEffect } from 'react';
import { useAuth } from '../stores/auth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SessionInfo = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="text-xs text-gray-400 text-right hidden lg:block">
      {user.last_sign_in_at && (
        <p>
          Dernière connexion: {format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
        </p>
      )}
      <p>
        Actuellement: {format(currentTime, 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
      </p>
    </div>
  );
};
