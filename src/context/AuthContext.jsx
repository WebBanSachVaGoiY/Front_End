import { createContext, useContext, useEffect, useReducer } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: true,
  isAuthenticated: false,
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
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'UPDATE_TOKEN':
      return { ...state, accessToken: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

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
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'SET_USER', payload: { ...state.user, ...userData } });
  };

  const isAdmin = () => state.user?.role === 'ROLE_ADMIN';
  const isCustomer = () => state.user?.role === 'ROLE_CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
        isAdmin,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
