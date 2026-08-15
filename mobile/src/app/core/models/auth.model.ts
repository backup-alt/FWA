export interface User {
  id: string;
  username: string;
  role: 'owner' | 'staff';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: 'owner' | 'staff';
}

export interface JwtPayload {
  id: string;
  username: string;
  role: 'owner' | 'staff';
  iat?: number;
  exp?: number;
}