import { env } from "@/core/config/env";
import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { AutorizarConexionUseCase } from "./application/useCases/AutorizarConexionUseCase";
import { CanjearCodigoUseCase } from "./application/useCases/CanjearCodigoUseCase";
import { McpController } from "./infrastructure/http/controllers/McpController";
import { OAuthController } from "./infrastructure/http/controllers/OAuthController";
import {
	DescubrimientoRouter,
	McpRouter,
	OAuthRouter,
} from "./infrastructure/http/routes/McpRouter";
import { PrismaCodigoOAuthRepository } from "./infrastructure/repository/PrismaCodigoOAuthRepository";

const repo = new PrismaCodigoOAuthRepository();

/** Conector para Claude: servidor MCP en `/mcp` y OAuth en el mismo dominio. */
export const mcpModule: AppModule = {
	mount(app, container) {
		const auth = container.get(AUTH_TOKENS.AuthMiddleware);
		const appUrl = env.APP_URL;
		const oauth = new OAuthController(appUrl, {
			autorizar: new AutorizarConexionUseCase(repo),
			canjear: new CanjearCodigoUseCase(
				repo,
				container.get(AUTH_TOKENS.CrearTokenPersonal),
			),
		});
		app.route(
			"/mcp",
			new McpRouter(
				auth,
				new McpController((ruta, init) => app.request(ruta, init)),
				appUrl,
			).router,
		);
		app.route("/.well-known", new DescubrimientoRouter(oauth).router);
		app.route("/api/oauth", new OAuthRouter(auth, oauth).router);
	},
	onStart(container) {
		container
			.get(TOKENS.Scheduler)
			.programar("mcp.limpiar-codigos", 60 * 60 * 1000, () =>
				repo.eliminarCaducados(),
			);
		return undefined;
	},
};
