import { useAuthStore } from "@/core/auth/store";
import { Avatar } from "@/core/components/ui/Avatar";
import { Badge } from "@/core/components/ui/Badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { Camera, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/core/components/ui/Button";
import { useAvatarMutation } from "../hooks/useAvatarMutation";

export function PerfilUsuarioCard() {
	const usuario = useAuthStore((state) => state.usuario);
	const avatar = useAvatarMutation();
	const inputArchivo = useRef<HTMLInputElement>(null);

	if (!usuario) {
		return (
			<Card>
				<p className="text-sm text-tinta-tenue">
					No hay información de sesión activa.
				</p>
			</Card>
		);
	}

	const varianteRol = usuario.roles.includes("ADMIN")
		? "purple"
		: usuario.roles.includes("MOD")
			? "warning"
			: "default";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-4">
					<Avatar
						nombre={usuario.nombre}
						url={usuario.avatarUrl}
						className="size-16 text-xl"
					/>
					<div className="flex-1">
						<CardTitle>{usuario.nombre}</CardTitle>
						<CardDescription className="flex items-center gap-2 mt-1">
							<Badge variant={varianteRol}>{usuario.roles.join(", ")}</Badge>
							<Badge variant={usuario.isActivo ? "success" : "danger"}>
								{usuario.isActivo ? "Cuenta activa" : "Cuenta inactiva"}
							</Badge>
						</CardDescription>
					</div>
					<div className="flex gap-2">
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
							{usuario.avatarUrl ? "Cambiar" : "Subir avatar"}
						</Button>
						{usuario.avatarUrl && (
							<Button
								variant="dangerGhost"
								size="sm"
								aria-label="Quitar avatar"
								onClick={() => avatar.mutate(null)}
								disabled={avatar.isPending}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="border-t border-borde pt-2">
				<dl className="divide-y divide-borde text-sm">
					<div className="grid gap-1 py-3 sm:grid-cols-3">
						<dt className="text-tinta-tenue">ID de usuario</dt>
						<dd className="text-tinta sm:col-span-2">#{usuario.id}</dd>
					</div>
					<div className="grid gap-1 py-3 sm:grid-cols-3">
						<dt className="text-tinta-tenue">Correo electrónico</dt>
						<dd className="truncate text-tinta sm:col-span-2">
							{usuario.email}
						</dd>
					</div>
					<div className="grid gap-1 py-3 sm:grid-cols-3">
						<dt className="text-tinta-tenue">Roles</dt>
						<dd className="text-tinta sm:col-span-2">
							{usuario.roles.join(", ")}
						</dd>
					</div>
					<div className="grid gap-1 py-3 sm:grid-cols-3">
						<dt className="text-tinta-tenue">Verificación</dt>
						<dd className="sm:col-span-2">
							{usuario.emailVerificado === false ? (
								<span className="text-amber-400">Email sin verificar</span>
							) : (
								<span className="text-emerald-400">Email verificado</span>
							)}
						</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	);
}
