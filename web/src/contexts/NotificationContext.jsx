import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeoutsRef = useRef({});

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, isExiting: true } : notification
    ));
    
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotifications(prev => {
      const existing = prev.find(n => n.message === message);
      let id;
      let nextState = prev;

      if (existing) {
        id = existing.id;
      } else {
        id = Date.now() + Math.random();
        nextState = [...prev, { id, message, type }];
      }

      if (duration > 0) {
        if (timeoutsRef.current[id]) {
          clearTimeout(timeoutsRef.current[id]);
        }
        timeoutsRef.current[id] = setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return nextState;
    });
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
