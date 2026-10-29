import type { LinkProps } from "@tanstack/react-router";
import { cn } from "@/core/utils/cn";
import {
	CircleDot,
	ListTodo,
	type LucideIcon,
	ShieldCheck,
	StickyNote,
	Tag,
	Users,
} from "lucide-react";

export interface ItemNavegacion {
	to: NonNullable<LinkProps["to"]>;
	etiqueta: string;
	icono: LucideIcon;
	/** `recurso:accion` necesario para verlo; sin él lo ve cualquier usuario. */
	permiso?: string;
}

interface GrupoNavegacion {
	titulo: string;
	items: ItemNavegacion[];
}

/** Menú lateral. Un módulo nuevo añade aquí su enlace; los grupos vacíos no se muestran. */
export const NAVEGACION: GrupoNavegacion[] = [
	{
		titulo: "Personal",
		items: [
			{
				to: "/dashboard",
				etiqueta: "Pendientes",
				icono: CircleDot,
				permiso: "tareas:leer",
			},
			{
				to: "/tareas",
				etiqueta: "Tareas",
				icono: ListTodo,
				permiso: "tareas:leer",
			},
			{
				to: "/notas",
				etiqueta: "Notas",
				icono: StickyNote,
				permiso: "notas:leer",
			},
			{ to: "/tags", etiqueta: "Tags", icono: Tag, permiso: "tags:leer" },
		],
	},
	{
		titulo: "Administración",
		items: [
			{
				to: "/usuarios",
				etiqueta: "Usuarios",
				icono: Users,
				permiso: "usuarios:leer",
			},
			{
				to: "/roles",
				etiqueta: "Roles",
				icono: ShieldCheck,
				permiso: "roles:leer",
			},
		],
	},
];

/** Clases de un enlace del menú lateral (también los de organizaciones). */
export const claseEnlaceLateral = (colapsado: boolean) =>
	cn(
		"group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-lateral-suave transition-colors hover:bg-lateral-elevada hover:text-lateral-tinta",
		"[&.active]:bg-lateral-elevada [&.active]:font-medium [&.active]:text-lateral-tinta",
		colapsado && "justify-center px-0",
	);
