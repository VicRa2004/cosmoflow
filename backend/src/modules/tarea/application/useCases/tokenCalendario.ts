import { createHash, randomBytes } from "node:crypto";

export const nuevoTokenCalendario = (): string =>
	randomBytes(24).toString("hex");

export const hashTokenCalendario = (token: string): string =>
	createHash("sha256").update(token).digest("hex");
