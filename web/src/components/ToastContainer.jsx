import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-36 left-0 right-0 z-[100] flex flex-col items-center space-y-2 pointer-events-none px-4">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className="bg-surface-container-highest/95 backdrop-blur-md text-on-surface px-6 py-4 rounded-2xl shadow-2xl flex items-center animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto w-full md:w-auto md:min-w-[300px] max-w-md border border-white/5"
        >
          <span className="material-symbols-outlined mr-3 text-primary">
            {notification.type === 'info' ? 'info' : notification.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <p className="font-medium text-sm">{notification.message}</p>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
