import { env } from "@/core/config/env";
import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { USUARIO_TOKENS } from "@/core/usuario";
import { EmisorCorreosCuenta } from "./application/services/EmisorCorreosCuenta";
import { EmisorSesion } from "./application/services/EmisorSesion";
import { CambiarPasswordUseCase } from "./application/useCases/CambiarPasswordUseCase";
import { AutenticarTokenPersonalUseCase } from "./application/useCases/AutenticarTokenPersonalUseCase";
import { CerrarSesionesUseCase } from "./application/useCases/CerrarSesionesUseCase";
import { CrearTokenPersonalUseCase } from "./application/useCases/CrearTokenPersonalUseCase";
import { EmitirTokensConexionUseCase } from "./application/useCases/EmitirTokensConexionUseCase";
import { LoginGoogleUseCase } from "./application/useCases/LoginGoogleUseCase";
import { LoginUseCase } from "./application/useCases/LoginUseCase";
import { LogoutUseCase } from "./application/useCases/LogoutUseCase";
import { ObtenerSesionesUseCase } from "./application/useCases/ObtenerSesionesUseCase";
import { ObtenerTokensPersonalesUseCase } from "./application/useCases/ObtenerTokensPersonalesUseCase";
import { RefreshTokenUseCase } from "./application/useCases/RefreshTokenUseCase";
import { ReenviarVerificacionUseCase } from "./application/useCases/ReenviarVerificacionUseCase";
import { RegistroUseCase } from "./application/useCases/RegistroUseCase";
import { RestablecerPasswordUseCase } from "./application/useCases/RestablecerPasswordUseCase";
import { RenovarTokensConexionUseCase } from "./application/useCases/RenovarTokensConexionUseCase";
import { RevocarSesionUseCase } from "./application/useCases/RevocarSesionUseCase";
import { RevocarTokenPersonalUseCase } from "./application/useCases/RevocarTokenPersonalUseCase";
import { DIAS_CONEXION_SIN_USO } from "./application/useCases/tokensConexion";
import { SolicitarRecuperacionUseCase } from "./application/useCases/SolicitarRecuperacionUseCase";
import { VerificarEmailUseCase } from "./application/useCases/VerificarEmailUseCase";
import { CuentaController } from "./infrastructure/http/controllers/CuentaController";
import { GoogleController } from "./infrastructure/http/controllers/GoogleController";
import { LoginController } from "./infrastructure/http/controllers/LoginController";
import { LogoutController } from "./infrastructure/http/controllers/LogoutController";
import { RefreshTokenController } from "./infrastructure/http/controllers/RefreshTokenController";
import { RegistroController } from "./infrastructure/http/controllers/RegistroController";
import { SesionController } from "./infrastructure/http/controllers/SesionController";
import { TokenPersonalController } from "./infrastructure/http/controllers/TokenPersonalController";
import { AuthMiddleware } from "./infrastructure/http/middlewares/authMiddleware";
import { AuthRouter } from "./infrastructure/http/routes/AuthRouter";
import { TokenPersonalRouter } from "./infrastructure/http/routes/TokenPersonalRouter";
import { PrismaCuentaRepository } from "./infrastructure/repository/PrismaCuentaRepository";
import { PrismaRefreshTokenRepository } from "./infrastructure/repository/PrismaRefreshTokenRepository";
import { PrismaTokenPersonalRepository } from "./infrastructure/repository/PrismaTokenPersonalRepository";
import { GoogleOAuthService } from "./infrastructure/service/GoogleOAuthService";
import { JwtService } from "./infrastructure/service/JwtService";
import { AUTH_TOKENS } from "./infrastructure/tokens";

// Internos del módulo: no se comparten, así que no pasan por el contenedor.
const tokenService = new JwtService();
const refreshTokenRepo = new PrismaRefreshTokenRepository();
const cuentaRepo = new PrismaCuentaRepository();
const tokenPersonalRepo = new PrismaTokenPersonalRepository();
const google =
	env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
		? new GoogleOAuthService(
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET,
				`${env.APP_URL}/api/auth/google/callback`,
			)
		: null;

export const authModule: AppModule = {
	register(container) {
		container.set(
			AUTH_TOKENS.EmitirTokensConexion,
			() => new EmitirTokensConexionUseCase(tokenService, tokenPersonalRepo),
		);
		container.set(
			AUTH_TOKENS.RenovarTokensConexion,
			() =>
				new RenovarTokensConexionUseCase(
					tokenService,
					tokenPersonalRepo,
					container.get(USUARIO_TOKENS.UsuarioRepository),
				),
		);
		container.set(
			AUTH_TOKENS.AuthMiddleware,
			() =>
				new AuthMiddleware(
					tokenService,
					new AutenticarTokenPersonalUseCase(
						tokenService,
						tokenPersonalRepo,
						container.get(USUARIO_TOKENS.UsuarioRepository),
					),
				),
		);
	},
	mount(app, container) {
		const usuarios = container.get(USUARIO_TOKENS.UsuarioRepository);
		const hasher = container.get(USUARIO_TOKENS.PasswordHasher);
		const sesiones = new EmisorSesion(tokenService, refreshTokenRepo);
		const correos = new EmisorCorreosCuenta(
			tokenService,
			cuentaRepo,
			container.get(TOKENS.Mailer),
			env.APP_URL,
		);

		const router = new AuthRouter(
			new LoginController(
				new LoginUseCase(usuarios, hasher, sesiones, cuentaRepo),
			),
			new RegistroController(
				new RegistroUseCase(usuarios, hasher, sesiones, correos),
			),
			new RefreshTokenController(
				new RefreshTokenUseCase(
					tokenService,
					refreshTokenRepo,
					usuarios,
					sesiones,
				),
			),
			new LogoutController(new LogoutUseCase(tokenService, refreshTokenRepo)),
			new CuentaController({
				solicitarRecuperacion: new SolicitarRecuperacionUseCase(
					usuarios,
					correos,
				),
				restablecerPassword: new RestablecerPasswordUseCase(
					tokenService,
					cuentaRepo,
					usuarios,
					hasher,
					refreshTokenRepo,
				),
				verificarEmail: new VerificarEmailUseCase(tokenService, cuentaRepo),
				reenviarVerificacion: new ReenviarVerificacionUseCase(
					usuarios,
					correos,
				),
				cambiarPassword: new CambiarPasswordUseCase(
					usuarios,
					hasher,
					refreshTokenRepo,
					sesiones,
				),
				cerrarSesiones: new CerrarSesionesUseCase(refreshTokenRepo),
			}),
			new GoogleController(
				google && {
					google,
					loginGoogle: new LoginGoogleUseCase(
						google,
						usuarios,
						hasher,
						cuentaRepo,
						refreshTokenRepo,
						sesiones,
					),
				},
			),
			new SesionController({
				obtenerTodos: new ObtenerSesionesUseCase(
					tokenService,
					refreshTokenRepo,
				),
				revocar: new RevocarSesionUseCase(tokenService, refreshTokenRepo),
			}),
			container.get(AUTH_TOKENS.AuthMiddleware),
		);
		app.route("/api/auth", router.router);
		app.route(
			"/api/tokens-personales",
			new TokenPersonalRouter(
				container.get(AUTH_TOKENS.AuthMiddleware),
				new TokenPersonalController({
					crear: new CrearTokenPersonalUseCase(tokenService, tokenPersonalRepo),
					obtenerTodos: new ObtenerTokensPersonalesUseCase(tokenPersonalRepo),
					revocar: new RevocarTokenPersonalUseCase(tokenPersonalRepo),
				}),
			).router,
		);
	},
	onStart(container) {
		container
			.get(TOKENS.Scheduler)
			.programar("auth.limpiar-tokens", 60 * 60 * 1000, async () => {
				await refreshTokenRepo.eliminarExpirados();
				await cuentaRepo.eliminarTokensCaducados();
				await tokenPersonalRepo.revocarConexionesSinUso(
					new Date(Date.now() - DIAS_CONEXION_SIN_USO * 24 * 60 * 60 * 1000),
				);
			});
		return undefined;
	},
};
