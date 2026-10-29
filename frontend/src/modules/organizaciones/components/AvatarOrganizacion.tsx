import { cn } from "@/core/utils/cn";
import { ImagenAdjunto } from "@/modules/adjuntos/components/ImagenAdjunto";
import type { OrganizacionDto } from "../api/organizacionesApi";

/** «Acme Corp» → «AC». */
const iniciales = (nombre: string) =>
	nombre
		.split(/\s+/)
		.slice(0, 2)
		.map((palabra) => palabra.charAt(0).toUpperCase())
		.join("");

/** Foto de la organización o sus iniciales sobre su color (RN-15). Decorativo. */
export function AvatarOrganizacion({
	organizacion: { nombre, color, avatarUrl },
	className,
}: {
	organizacion: Pick<OrganizacionDto, "nombre" | "color" | "avatarUrl">;
	className?: string;
}) {
	const base = "size-8 shrink-0 rounded-md";
	if (avatarUrl) {
		// El avatar es privado (solo miembros): se descarga con el token, como los adjuntos.
		return (
			<ImagenAdjunto
				src={avatarUrl}
				alt=""
				className={cn(base, "object-cover", className)}
			/>
		);
	}
	return (
		<span
			aria-hidden
			style={{ backgroundColor: color }}
			className={cn(
				base,
				"flex items-center justify-center text-xs font-semibold text-white",
				className,
			)}
		>
			{iniciales(nombre)}
		</span>
	);
}
