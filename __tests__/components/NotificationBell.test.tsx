import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock NotificationBell component
const NotificationBell = ({ count = 0 }: { count?: number }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div data-testid="notification-bell">
      <button
        data-testid="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        🔔
        {count > 0 && (
          <span data-testid="notification-count" className="badge">
            {count}
          </span>
        )}
      </button>
      {isOpen && (
        <div data-testid="notification-dropdown">
          <p>Notifications</p>
          {count === 0 ? (
            <p data-testid="no-notifications">No new notifications</p>
          ) : (
            <p data-testid="has-notifications">{count} new notifications</p>
          )}
        </div>
      )}
    </div>
  );
};

describe('NotificationBell Component', () => {
  test('renders notification bell button', () => {
    render(<NotificationBell />);
    
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByTestId('bell-button')).toBeInTheDocument();
  });

  test('shows notification count when count > 0', () => {
    render(<NotificationBell count={5} />);
    
    expect(screen.getByTestId('notification-count')).toBeInTheDocument();
    expect(screen.getByTestId('notification-count')).toHaveTextContent('5');
  });

  test('hides notification count when count is 0', () => {
    render(<NotificationBell count={0} />);
    
    expect(screen.queryByTestId('notification-count')).not.toBeInTheDocument();
  });

  test('toggles dropdown when bell is clicked', () => {
    render(<NotificationBell count={3} />);
    
    const bellButton = screen.getByTestId('bell-button');
    
    // Initially closed
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    
    // Click to open
    fireEvent.click(bellButton);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('has-notifications')).toHaveTextContent('3 new notifications');
    
    // Click to close
    fireEvent.click(bellButton);
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });
});
