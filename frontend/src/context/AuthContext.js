import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);  // ← ДОБАВЛЕНО
  const [isLoading, setIsLoading] = useState(true);

  // Функция для синхронизации с localStorage
  const syncWithLocalStorage = () => {
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (storedToken && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setToken(storedToken);  // ← ДОБАВЛЕНО
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);  // ← ДОБАВЛЕНО
      }
    } else {
      setUser(null);
      setToken(null);  // ← ДОБАВЛЕНО
    }
  };

  useEffect(() => {
    // Первоначальная загрузка
    syncWithLocalStorage();
    setIsLoading(false);

    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      syncWithLocalStorage();
    };

    // Событие для обновления в той же вкладке
    const handleCustomAuthChange = () => {
      syncWithLocalStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-state-change', handleCustomAuthChange);

    // Периодическая проверка (каждые 3 секунды)
    const interval = setInterval(syncWithLocalStorage, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-change', handleCustomAuthChange);
      clearInterval(interval);
    };
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);  // ← ДОБАВЛЕНО
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    // Триггерим событие для обновления других компонентов
    window.dispatchEvent(new Event('auth-state-change'));
  };

  const logout = () => {
    setUser(null);
    setToken(null);  // ← ДОБАВЛЕНО
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-state-change'));
  };

  const value = {
    user,
    token,           // ← ТЕПЕРЬ ЕСТЬ
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};