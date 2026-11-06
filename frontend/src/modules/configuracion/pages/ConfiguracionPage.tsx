import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle } from "@/core/components/ui/Card";
import { Checkbox } from "@/core/components/ui/Checkbox";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { Select } from "@/core/components/ui/Select";
import { Spinner } from "@/core/components/ui/Spinner";
import { cambiarTema, type Tema, useTema } from "@/core/tema";
import { ContenidoMarkdown } from "@/modules/adjuntos/components/ContenidoMarkdown";
import type { PreferenciasInterfaz } from "../api/preferenciasApi";
import {
	limiteOrganizacionesPendientes,
	useCambiarPreferenciasMutation,
	usePreferenciasQuery,
} from "../hooks/usePreferencias";

const EJEMPLO = `## Ejemplo de nota

Así se verán tus **tareas** y *notas*, con un [enlace](https://example.com) y \`código\`.

- [x] Revisar la propuesta
- [ ] Preparar la demo

> Una cita para ver el interlineado.`;

/** Opciones de cada preferencia de lista: valor → etiqueta. */
const OPCIONES = {
	tamanoInterfaz: { pequeno: "Compacto", normal: "Normal", grande: "Grande" },
	markdownFuente: {
		inter: "Inter (la de la app)",
		sistema: "Sans del sistema",
		serif: "Serif",
		mono: "Monoespaciada",
	},
	markdownTamano: { pequeno: "Pequeño", normal: "Normal", grande: "Grande" },
	markdownInterlineado: {
		compacto: "Compacto",
		normal: "Normal",
		amplio: "Amplio",
	},
	markdownColor: { suave: "Suave", intenso: "Alto contraste" },
} satisfies {
	[K in keyof PreferenciasInterfaz]?: Record<
		PreferenciasInterfaz[K] & string,
		string
	>;
};

function Seccion({
	titulo,
	descripcion,
	children,
}: {
	titulo: string;
	descripcion: string;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{titulo}</CardTitle>
				<p className="text-sm text-tinta-tenue">{descripcion}</p>
			</CardHeader>
			<div className="space-y-4">{children}</div>
		</Card>
	);
}

/** Preferencias de interfaz: se guardan en tu cuenta al momento (el tema, en este navegador). */
export function ConfiguracionPage() {
	const { data: p, error } = usePreferenciasQuery();
	const cambiar = useCambiarPreferenciasMutation();
	const { preferencia: tema } = useTema();

	if (error) throw error;
	if (!p) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}

	const lista = (clave: keyof typeof OPCIONES, label: string) => (
		<Select
			label={label}
			value={p[clave]}
			// Las opciones salen de OPCIONES[clave]: el valor siempre es válido.
			onChange={(e) => cambiar.mutate({ [clave]: e.target.value })}
		>
			{Object.entries(OPCIONES[clave]).map(([valor, etiqueta]) => (
				<option key={valor} value={valor}>
					{etiqueta}
				</option>
			))}
		</Select>
	);

	return (
		<div className="max-w-2xl space-y-6">
			<EncabezadoPagina
				titulo="Configuración"
				descripcion="Personaliza la app. Se guarda en tu cuenta y te sigue en cualquier dispositivo."
			/>

			<Seccion titulo="Apariencia" descripcion="Tema y tamaño de la interfaz.">
				<div className="grid gap-4 sm:grid-cols-2">
					<Select
						label="Tema"
						helperText="Se guarda en este navegador."
						value={tema}
						onChange={(e) => cambiarTema(e.target.value as Tema)}
					>
						<option value="sistema">Del sistema</option>
						<option value="claro">Claro</option>
						<option value="oscuro">Oscuro</option>
					</Select>
					{lista("tamanoInterfaz", "Tamaño de la interfaz")}
				</div>
			</Seccion>

			<Seccion
				titulo="Markdown"
				descripcion="Cómo se leen y editan tareas y notas."
			>
				<div className="grid gap-4 sm:grid-cols-2">
					{lista("markdownFuente", "Fuente")}
					{lista("markdownTamano", "Tamaño")}
					{lista("markdownInterlineado", "Interlineado")}
					{lista("markdownColor", "Color del texto")}
				</div>
				<div className="rounded-md border border-borde bg-fondo p-4">
					<ContenidoMarkdown>{EJEMPLO}</ContenidoMarkdown>
				</div>
			</Seccion>

			<Seccion
				titulo="Pendientes"
				descripcion="Qué ofrece el botón «Nueva» de la portada."
			>
				<Checkbox
					label="Permitir crear notas desde Pendientes"
					checked={p.pendientesNotas}
					onChange={(e) =>
						cambiar.mutate({ pendientesNotas: e.target.checked })
					}
				/>
				<Select
					label="Organizaciones en el menú"
					helperText={`Ahora: las ${limiteOrganizacionesPendientes(p)} más recientes.`}
					value={p.pendientesOrganizaciones ?? ""}
					onChange={(e) =>
						cambiar.mutate({
							pendientesOrganizaciones: e.target.value
								? Number(e.target.value)
								: null,
						})
					}
				>
					<option value="">Automático (20 sin notas, 10 con notas)</option>
					{[5, 10, 20, 30, 50].map((n) => (
						<option key={n} value={n}>
							{n}
						</option>
					))}
				</Select>
			</Seccion>
		</div>
	);
}
