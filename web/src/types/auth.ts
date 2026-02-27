
export interface LoginForm {
  username: string
  password: string
  remember_me: boolean
}

export interface RegisterForm {
  username: string
  email: string
  password: string
}

export interface User {
  id: string;
  email: string;
  scopes: string;
  full_name: string | null;
  is_active: boolean | null;
  is_superuser: boolean | null;
  create_date: string | null;
  profile: string | null;
}

export interface LoginResponse {
  user_id: string;
  message: string;
  timestamp: string;
  scopes: string[];
  status: number;
}
