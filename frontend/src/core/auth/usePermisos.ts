import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient } from "@/core/api/client";
import type { PermisoDto } from "@/core/api/schema.gen";
import { useAuthStore } from "./store";

const TODOS = "todos";

/**
 * Permisos efectivos del usuario (`recurso:accion`) para ocultar lo que no puede usar.
 * Solo es interfaz: quien decide es el backend, que responde 403.
 */
export function usePermisos() {
	const { data, isError } = useQuery({
		queryKey: ["permisos", "mios"],
		queryFn: async () => {
			try {
				const { data } = await apiClient.get<PermisoDto[]>("/permisos/mios");
				return new Set(data.map((p) => `${p.recurso}:${p.accion}`));
			} catch (error) {
				// Sin el módulo `autorizacion` no existe la ruta y el backend deja pasar a cualquier autenticado.
				if (isAxiosError(error) && error.response?.status === 404) return TODOS;
				throw error;
			}
		},
		staleTime: 5 * 60_000,
	});

	/** Mientras carga (o si falla) responde `false`: mejor no enseñar que enseñar de más. */
	const puede = (permiso?: string) =>
		!permiso || data === TODOS || (data?.has(permiso) ?? false);

	/** Rol ADMIN de la sesión: algunas vistas lo exigen además del permiso. */
	const esAdmin = useAuthStore(
		(s) => s.usuario?.roles.includes("ADMIN") ?? false,
	);

	/** `true` cuando ya se sabe qué puede (o la consulta falló). */
	const listo = data !== undefined || isError;

	return { puede, esAdmin, listo };
}
