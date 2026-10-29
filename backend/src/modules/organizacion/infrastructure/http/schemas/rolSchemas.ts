import { z } from "@hono/zod-openapi";
import { PERMISOS_ORGANIZACION } from "../../../domain/permisosOrganizacion";

const id = z
	.string()
	.regex(/^\d+$/, "El ID debe ser un número válido")
	.transform(Number);

export const rolParamsSchema = z.object({ id, rolId: id });

const permiso = z.enum(PERMISOS_ORGANIZACION).openapi("PermisoOrganizacion");

export const guardarRolSchema = z.object({
	nombre: z
		.string()
		.trim()
		.min(1, "El nombre es obligatorio")
		.max(64, "Máximo 64 caracteres"),
	permisos: z.array(permiso).max(PERMISOS_ORGANIZACION.length),
});

export const asignarRolesSchema = z.object({
	rolIds: z.array(z.number().int().positive()).max(50),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const rolDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		nombre: z.string().openapi({ example: "Editor" }),
		permisos: z.array(permiso),
		totalMiembros: z.number().int().openapi({ example: 2 }),
	})
	.openapi("RolOrganizacionDto");

export const catalogoSchema = z
	.object({
		permisos: z.array(permiso),
		plantillas: z.array(
			z.object({ nombre: z.string(), permisos: z.array(permiso) }),
		),
	})
	.openapi("CatalogoPermisosOrganizacion");
