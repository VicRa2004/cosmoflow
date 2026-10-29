import type { AuthResponse, UsuarioDto } from "@/core/api/schema.gen";

export type { AuthResponse };
export type Usuario = UsuarioDto;

// El refresh token vive en una cookie httpOnly que gestiona el backend.
export type AuthTokens = Pick<AuthResponse, "accessToken">;

export interface AuthState {
	usuario: Usuario | null;
	accessToken: string | null;
	isAuthenticated: boolean;
	login: (payload: AuthResponse) => void;
	setTokens: (tokens: AuthTokens) => void;
	logout: () => void;
	actualizarUsuario: (datosUsuario: Partial<Usuario>) => void;
}
