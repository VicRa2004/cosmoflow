import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { LoginUseCase } from "../../../application/useCases/LoginUseCase";

import { validate } from "@/core/shared/infrastructure/libs/validate";
import { entregarRefreshToken } from "../refreshTokenCookie";
import { loginSchema } from "../schemas/authSchemas";

export class LoginController extends BaseController {
	constructor(private readonly loginUseCase: LoginUseCase) {
		super();
	}

	ejecutar = async (c: Context): Promise<Response> => {
		return this.executeSafely(c, async () => {
			const body = await c.req.json();
			const dto = validate(loginSchema, body);
			const { refreshToken, ...session } =
				await this.loginUseCase.ejecutar(dto);

			return this.ok(c, {
				...session,
				...entregarRefreshToken(c, refreshToken),
			});
		});
	};
}
