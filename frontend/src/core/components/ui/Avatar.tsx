import { cn } from "@/core/utils/cn";

interface AvatarProps {
	nombre: string;
	url?: string | null;
	className?: string;
}

/** Foto del usuario o su inicial. Decorativo: el nombre siempre va al lado. */
export function Avatar({ nombre, url, className }: AvatarProps) {
	const base = "size-8 shrink-0 rounded-full";
	if (url) {
		return (
			<img src={url} alt="" className={cn(base, "object-cover", className)} />
		);
	}
	return (
		<span
			aria-hidden
			className={cn(
				base,
				"flex items-center justify-center bg-elevada text-xs font-semibold text-tinta-suave",
				className,
			)}
		>
			{nombre.charAt(0).toUpperCase()}
		</span>
	);
}
