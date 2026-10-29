import { Hexagon } from "lucide-react";
import { cn } from "@/core/utils/cn";

/** Isotipo de Cosmoflow. */
export function Marca({ className }: { className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				"flex size-7 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white",
				className,
			)}
		>
			<Hexagon className="size-4 stroke-[2.4]" />
		</span>
	);
}
