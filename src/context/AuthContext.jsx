import { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('bookrunner_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: true,
  isAuthenticated: Boolean(localStorage.getItem('accessToken')),
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'SET_USER': {
      try {
        localStorage.setItem('bookrunner_current_user', JSON.stringify(action.payload));
      } catch {
        // ignore
      }
      return { ...state, user: action.payload, isAuthenticated: Boolean(action.payload), isLoading: false };
    }
    case 'UPDATE_USER': {
      const updatedUser = { ...state.user, ...action.payload };
      try {
        localStorage.setItem('bookrunner_current_user', JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
      return { ...state, user: updatedUser, isAuthenticated: true, isLoading: false };
    }
    case 'UPDATE_TOKEN':
      return { ...state, accessToken: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Bỏ qua lỗi API (ví dụ token đã chết 401 hoặc rớt mạng)
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // On mount: validate existing token and load user info
  useEffect(() => {
    const handleForceLogout = () => {
      logout();
    };
    window.addEventListener('auth:logout', handleForceLogout);

    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const user = await authApi.getMe();
        dispatch({ type: 'SET_USER', payload: user });
      } catch {
        // Token expired or invalid → try refresh
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token');
          const data = await authApi.refresh(refreshToken);
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          dispatch({ type: 'UPDATE_TOKEN', payload: data.accessToken });
          const user = await authApi.getMe();
          dispatch({ type: 'SET_USER', payload: user });
        } catch {
          logout();
        }
      }
    };
    init();

    return () => {
      window.removeEventListener('auth:logout', handleForceLogout);
    };
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    let fullUser = data.user;
    if (!fullUser?.phone || !fullUser?.address) {
      try {
        const profile = await authApi.getMe();
        if (profile) {
          fullUser = { ...fullUser, ...profile };
          localStorage.setItem('bookrunner_current_user', JSON.stringify(fullUser));
        }
      } catch {
        // fallback giữ nguyên fullUser từ login
      }
    }
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: fullUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
    });
    return data;
  }, []);

  const updateUser = useCallback((userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  }, []);

  const isAdmin = useCallback(() => state.user?.role === 'ROLE_ADMIN', [state.user]);
  const isCustomer = useCallback(() => state.user?.role === 'ROLE_CUSTOMER', [state.user]);

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      logout,
      updateUser,
      isAdmin,
      isCustomer,
    }),
    [state, login, logout, updateUser, isAdmin, isCustomer]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
