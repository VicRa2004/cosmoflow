import type { Context, Next } from "hono";
import { contexto } from "@/core/shared/infrastructure/contexto";
import { PREFIJO_TOKEN_PERSONAL } from "../../../domain/repository/TokenPersonalRepository";
import type {
	AccessTokenPayload,
	TokenService,
} from "../../../domain/service/TokenService";

/** Variables de contexto que publica este middleware para los siguientes handlers. */
export type AuthEnv = { Variables: { usuario: AccessTokenPayload } };

/**
 * Middleware de autenticación mediante JWT o token personal.
 * Intercepta la petición para validar la existencia y validez de un token Bearer.
 * Si el token es válido, inyecta los datos del usuario decodificados en el contexto de Hono.
 *
 * @example
 * app.use("/api/*", authMiddleware.handle);
 * app.get("/api/perfil", authMiddleware.handle, controller.ejecutar.bind(controller));
 */
export class AuthMiddleware {
	constructor(
		private readonly tokenService: TokenService,
		private readonly tokensPersonales: {
			ejecutar(token: string): Promise<AccessTokenPayload | null>;
		},
	) {}

	/**
	 * Manejador del middleware para Hono.
	 * Verifica el header 'Authorization', extrae el token y lo valida.
	 *
	 * @param {Context} c - Contexto de la petición de Hono (contiene req, res y variables de estado).
	 * @param {Next} next - Función asíncrona para ceder el control al siguiente middleware o controlador.
	 * @returns {Promise<Response | undefined>} Retorna una respuesta HTTP 401 si falla, o cede el control con `await next()`.
	 */
	handle = async (
		c: Context<AuthEnv>,
		next: Next,
	): Promise<Response | undefined> => {
		// En Hono, los headers se obtienen a través de c.req.header()
		const headerAuth = c.req.header("Authorization");

		if (!headerAuth?.startsWith("Bearer ")) {
			return c.json(
				{
					success: false,
					error: "No se proporcionó un token de autenticación",
				},
				401,
			);
		}

		const token = headerAuth.split(" ")[1];

		if (!token) {
			return c.json({ success: false, error: "Token inválido" }, 401);
		}

		// next() queda fuera del try: un error del controlador no es un token inválido.
		// En lugar de mutar req (ej. req.usuario), en Hono guardamos datos en el contexto
		// usando c.set() para que otros middlewares/controladores puedan leerlo con c.get()
		const usuario = await this.resolverUsuario(token);
		if (!usuario) {
			return c.json(
				{ success: false, error: "Token inválido o expirado" },
				401,
			);
		}
		c.set("usuario", usuario);
		contexto.completar({ usuarioId: usuario.id });

		await next(); // Siempre debe llevar await en Hono
	};

	/** Tras `handle`: un token personal robado no puede crear otros ni revocarlos. */
	soloSesion = async (
		c: Context,
		next: Next,
	): Promise<Response | undefined> => {
		const token = c.req.header("Authorization")?.split(" ")[1];
		if (token?.startsWith(PREFIJO_TOKEN_PERSONAL)) {
			return c.json({ success: false, error: "Requiere iniciar sesión" }, 403);
		}
		await next();
	};

	/** Un fallo de la BD no es un token inválido: sube como 500. */
	private async resolverUsuario(
		token: string,
	): Promise<AccessTokenPayload | null> {
		if (token.startsWith(PREFIJO_TOKEN_PERSONAL)) {
			return this.tokensPersonales.ejecutar(token);
		}
		try {
			return this.tokenService.verificarToken(token);
		} catch {
			return null;
		}
	}
}
