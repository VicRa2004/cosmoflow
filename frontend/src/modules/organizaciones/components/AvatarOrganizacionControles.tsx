import { Camera, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/core/components/ui/Button";
import type { OrganizacionDto } from "../api/organizacionesApi";
import { AvatarOrganizacion } from "./AvatarOrganizacion";

/** Avatar grande con subir/quitar, de la organización o de un equipo. Solo para quien puede editar. */
export function AvatarOrganizacionControles({
	organizacion,
	avatar,
}: {
	organizacion: Pick<OrganizacionDto, "nombre" | "color" | "avatarUrl">;
	/** Sube con un archivo y quita con `null`. */
	avatar: { mutate: (archivo: File | null) => void; isPending: boolean };
}) {
	const inputArchivo = useRef<HTMLInputElement>(null);

	return (
		<div className="flex items-center gap-4">
			<AvatarOrganizacion
				organizacion={organizacion}
				className="size-16 text-xl"
			/>
			<input
				ref={inputArchivo}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				className="hidden"
				aria-label="Archivo del avatar"
				onChange={(e) => {
					const archivo = e.target.files?.[0];
					if (archivo) avatar.mutate(archivo);
					e.target.value = "";
				}}
			/>
			<Button
				variant="outline"
				size="sm"
				onClick={() => inputArchivo.current?.click()}
				isLoading={avatar.isPending}
			>
				<Camera className="h-4 w-4" />
				{organizacion.avatarUrl ? "Cambiar" : "Subir imagen"}
			</Button>
			{organizacion.avatarUrl && (
				<Button
					variant="dangerGhost"
					size="sm"
					aria-label="Quitar imagen"
					onClick={() => avatar.mutate(null)}
					disabled={avatar.isPending}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
