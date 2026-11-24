import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { CompletarLoginDosPasosUseCase } from "../../../application/useCases/CompletarLoginDosPasosUseCase";
import type { LoginUseCase } from "../../../application/useCases/LoginUseCase";
import { entregarRefreshToken } from "../refreshTokenCookie";
import { loginDosPasosSchema, loginSchema } from "../schemas/authSchemas";

export class LoginController extends BaseController {
	constructor(
		private readonly useCases: {
			login: LoginUseCase;
			completarDosPasos: CompletarLoginDosPasosUseCase;
		},
	) {
		super();
	}

	login = (c: Context): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(loginSchema, await c.req.json());
			const resultado = await this.useCases.login.ejecutar(dto);
			// Falta el código: aún no hay sesión ni cookie.
			if ("requiereDosPasos" in resultado) return this.ok(c, resultado);

			const { refreshToken, ...sesion } = resultado;
			return this.ok(c, {
				...sesion,
				...entregarRefreshToken(c, refreshToken),
			});
		});

	completarDosPasos = (c: Context): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(loginDosPasosSchema, await c.req.json());
			const { refreshToken, ...sesion } =
				await this.useCases.completarDosPasos.ejecutar(dto);
			return this.ok(c, {
				...sesion,
				...entregarRefreshToken(c, refreshToken),
			});
		});
}
