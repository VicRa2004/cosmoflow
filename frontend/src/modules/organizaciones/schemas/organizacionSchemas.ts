import { z } from "zod";
import type { OrganizacionDto } from "../api/organizacionesApi";

/** Valida lo que se escribe en el formulario y lo convierte al cuerpo de la API. */
export const organizacionFormSchema = z.object({
	nombre: z
		.string()
		.trim()
		.min(1, "Obligatorio")
		.max(100, "Máximo 100 caracteres"),
	descripcion: z.string().trim().max(500, "Máximo 500 caracteres"),
	color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color no válido"),
});

export type OrganizacionFormValues = z.input<typeof organizacionFormSchema>;

/** El acento índigo de la paleta como color inicial. */
export const organizacionFormVacio: OrganizacionFormValues = {
	nombre: "",
	descripcion: "",
	color: "#6366f1",
};

export const organizacionAFormValues = ({
	nombre,
	descripcion,
	color,
}: OrganizacionDto): OrganizacionFormValues => ({ nombre, descripcion, color });

export const invitarFormSchema = z.object({
	email: z.email("Email no válido").trim(),
});
