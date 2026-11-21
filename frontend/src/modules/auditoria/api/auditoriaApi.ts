import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type RegistroAuditoria = components["schemas"]["RegistroAuditoria"];
type AuditoriaPagina =
	paths["/api/auditoria"]["get"]["responses"][200]["content"]["application/json"];

export interface ObtenerAuditoriaParams {
	pagina?: number;
	limite?: number;
	evento?: string;
	usuarioId?: number;
}

export const auditoriaApi = {
	async obtenerTodos(
		params: ObtenerAuditoriaParams = {},
	): Promise<AuditoriaPagina> {
		const response = await apiClient.get<AuditoriaPagina>("/auditoria", {
			params,
		});
		return response.data;
	},
};
