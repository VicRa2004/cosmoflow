import {
	Archive,
	BookOpen,
	Brain,
	Briefcase,
	FlaskConical,
	Folder,
	FolderOpen,
	Heart,
	House,
	Lightbulb,
	type LucideIcon,
	NotebookPen,
	Palette,
	Plane,
	Star,
	Target,
	Wallet,
} from "lucide-react";
import { cn } from "@/core/utils/cn";

/** Iconos elegibles; en BD se guarda la clave (máx. 16 caracteres). */
export const ICONOS_CARPETA: Record<string, LucideIcon> = {
	folder: Folder,
	"folder-open": FolderOpen,
	archive: Archive,
	book: BookOpen,
	notebook: NotebookPen,
	lightbulb: Lightbulb,
	star: Star,
	target: Target,
	briefcase: Briefcase,
	house: House,
	plane: Plane,
	palette: Palette,
	flask: FlaskConical,
	wallet: Wallet,
	heart: Heart,
	brain: Brain,
};

/** Clave desconocida (p. ej. los emojis de antes) o vacía: carpeta. */
export function IconoCarpeta({
	icono,
	className,
}: {
	icono?: string | null;
	className?: string;
}) {
	const Icono = (icono && ICONOS_CARPETA[icono]) || Folder;
	return (
		<Icono
			aria-hidden
			className={cn("h-3.5 w-3.5 shrink-0 text-tinta-tenue", className)}
		/>
	);
}
