import { useNavigate } from "@tanstack/react-router";
import { Crown, LogOut, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/core/auth/store";
import { Avatar } from "@/core/components/ui/Avatar";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import type { MiembroDto } from "../api/miembrosApi";
import type { OrganizacionDto } from "../api/organizacionesApi";
import { useGestionMiembros, useMiembrosQuery } from "../hooks/useMiembros";

type Accion = { tipo: "salir" | "expulsar" | "delegar"; miembro: MiembroDto };

const TEXTOS = {
	salir: {
		titulo: () => "¿Salir de la organización?",
		mensaje: (o: string) =>
			`Dejarás de ver «${o}». Para volver necesitarás otra invitación.`,
		confirmar: "Salir",
	},
	expulsar: {
		titulo: (m: MiembroDto) => `¿Expulsar a ${m.nombre}?`,
		mensaje: () => "Perderá el acceso; para volver necesitará otra invitación.",
		confirmar: "Expulsar",
	},
	delegar: {
		titulo: (m: MiembroDto) => `¿Hacer administrador a ${m.nombre}?`,
		mensaje: () =>
			"Solo hay un administrador: tú pasarás a ser un miembro normal.",
		confirmar: "Delegar",
	},
} as const;

/** Lista de miembros; el admin expulsa o delega y cualquier otro puede salir (RN-11, RN-16). */
export function MiembrosCard({
	organizacion,
}: {
	organizacion: OrganizacionDto;
}) {
	const navigate = useNavigate();
	const yo = useAuthStore((state) => state.usuario?.id);
	const { data: miembros } = useMiembrosQuery(organizacion.id);
	const { quitar, delegar } = useGestionMiembros(organizacion.id);
	const [accion, setAccion] = useState<Accion | null>(null);

	const confirmar = () => {
		if (!accion) return;
		const { tipo, miembro } = accion;
		const cerrar = { onSuccess: () => setAccion(null) };
		if (tipo === "delegar") return delegar.mutate(miembro.usuarioId, cerrar);
		quitar.mutate(miembro.usuarioId, {
			onSuccess: () => {
				setAccion(null);
				if (tipo === "salir") {
					toast.success(`Saliste de ${organizacion.nombre}`);
					navigate({ to: "/organizaciones" });
				} else {
					toast.success(`${miembro.nombre} ya no es miembro`);
				}
			},
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Miembros</CardTitle>
				{organizacion.isAdmin && (
					<CardDescription>
						Para salir, primero delega la administración en otro miembro.
					</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<ul className="divide-y divide-borde">
					{miembros?.map((miembro) => {
						const soyYo = miembro.usuarioId === yo;
						return (
							<li
								key={miembro.usuarioId}
								className="flex items-center gap-3 py-2.5 text-sm"
							>
								<Avatar nombre={miembro.nombre} url={miembro.avatarUrl} />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-tinta">
										{miembro.nombre}
										{soyYo && <span className="text-tinta-tenue"> (tú)</span>}
									</p>
									<p className="truncate text-xs text-tinta-tenue">
										{miembro.email}
									</p>
								</div>
								{miembro.isAdmin && (
									<Badge variant="purple">Administrador</Badge>
								)}
								{soyYo && !miembro.isAdmin && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setAccion({ tipo: "salir", miembro })}
									>
										<LogOut className="h-4 w-4" />
										Salir
									</Button>
								)}
								{organizacion.isAdmin && !soyYo && (
									<>
										<Button
											variant="ghost"
											size="sm"
											aria-label={`Hacer administrador a ${miembro.nombre}`}
											title="Hacer administrador"
											onClick={() => setAccion({ tipo: "delegar", miembro })}
										>
											<Crown className="h-4 w-4" />
										</Button>
										<Button
											variant="dangerGhost"
											size="sm"
											aria-label={`Expulsar a ${miembro.nombre}`}
											title="Expulsar"
											onClick={() => setAccion({ tipo: "expulsar", miembro })}
										>
											<UserMinus className="h-4 w-4" />
										</Button>
									</>
								)}
							</li>
						);
					})}
				</ul>
			</CardContent>

			<ConfirmDialog
				abierto={accion !== null}
				titulo={accion ? TEXTOS[accion.tipo].titulo(accion.miembro) : ""}
				mensaje={accion ? TEXTOS[accion.tipo].mensaje(organizacion.nombre) : ""}
				textoConfirmar={accion ? TEXTOS[accion.tipo].confirmar : ""}
				peligroso={accion?.tipo !== "delegar"}
				isLoading={quitar.isPending || delegar.isPending}
				onCancelar={() => setAccion(null)}
				onConfirmar={confirmar}
			/>
		</Card>
	);
}
