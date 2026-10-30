import { createHash } from "node:crypto";

/** El token del enlace solo viaja en claro hasta Telegram; en BD va su hash. */
export const hashToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");
