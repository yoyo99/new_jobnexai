import { Routes, Route, Navigate } from 'react-router-dom';

export function RedirectRoutes() {
  return (
    <Routes>
      {/* Main redirections */}
      <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
      
      {/* Legacy redirections to /app */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/letters" element={<Navigate to="/app/letters" replace />} />
    </Routes>
  );
}
