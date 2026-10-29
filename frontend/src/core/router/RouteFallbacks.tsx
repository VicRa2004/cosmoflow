import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";

function FallbackCard({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-fondo p-4">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent className="flex justify-center gap-2">
					{children}
				</CardContent>
			</Card>
		</div>
	);
}

/** Pantalla para errores no controlados de una ruta (en vez de dejarla en blanco). */
export function DefaultErrorComponent({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	return (
		<FallbackCard
			title="Algo salió mal"
			description={
				import.meta.env.DEV && error instanceof Error
					? error.message
					: "Ha ocurrido un error inesperado."
			}
		>
			<Button
				onClick={() => {
					reset();
					router.invalidate();
				}}
			>
				Reintentar
			</Button>
			<Button variant="outline" onClick={() => router.navigate({ to: "/" })}>
				Ir al inicio
			</Button>
		</FallbackCard>
	);
}

export function DefaultNotFoundComponent() {
	const router = useRouter();

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-fondo p-6 text-center">
			<Compass aria-hidden className="size-8 text-tinta-tenue" />
			<div className="space-y-1.5">
				<h1 className="text-xl font-semibold tracking-tight text-tinta">
					Página no encontrada
				</h1>
				<p className="max-w-sm text-sm text-tinta-tenue">
					La dirección no existe o ha cambiado (error 404). Comprueba el enlace
					o vuelve a un sitio conocido.
				</p>
			</div>
			<div className="flex gap-2">
				<Button variant="outline" onClick={() => router.history.back()}>
					<ArrowLeft className="h-4 w-4" />
					Volver
				</Button>
				<Button onClick={() => router.navigate({ to: "/" })}>
					Ir al inicio
				</Button>
			</div>
		</main>
	);
}
