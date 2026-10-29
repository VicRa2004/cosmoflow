import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type InvitacionDto = components["schemas"]["InvitacionDto"];
export type InvitacionRecibidaDto =
	components["schemas"]["InvitacionRecibidaDto"];
type RespuestaInvitacionDto = components["schemas"]["RespuestaInvitacionDto"];

const base = (organizacionId: number) =>
	`/organizaciones/${organizacionId}/invitaciones`;

export const invitacionesApi = {
	async obtenerTodas(organizacionId: number): Promise<InvitacionDto[]> {
		const response = await apiClient.get<InvitacionDto[]>(base(organizacionId));
		return response.data;
	},

	async invitar(organizacionId: number, email: string): Promise<InvitacionDto> {
		const response = await apiClient.post<InvitacionDto>(base(organizacionId), {
			email,
		});
		return response.data;
	},

	async reenviar(organizacionId: number, id: number): Promise<InvitacionDto> {
		const response = await apiClient.post<InvitacionDto>(
			`${base(organizacionId)}/${id}/reenviar`,
		);
		return response.data;
	},

	async cancelar(organizacionId: number, id: number): Promise<void> {
		await apiClient.delete(`${base(organizacionId)}/${id}`);
	},

	// El token va en el cuerpo, no en la URL, para que no acabe en logs.
	async consultar(token: string): Promise<InvitacionRecibidaDto> {
		const response = await apiClient.post<InvitacionRecibidaDto>(
			"/invitaciones/consultar",
			{ token },
		);
		return response.data;
	},

	async responder(
		token: string,
		aceptar: boolean,
	): Promise<RespuestaInvitacionDto> {
		const response = await apiClient.post<RespuestaInvitacionDto>(
			`/invitaciones/${aceptar ? "aceptar" : "rechazar"}`,
			{ token },
		);
		return response.data;
	},
};
