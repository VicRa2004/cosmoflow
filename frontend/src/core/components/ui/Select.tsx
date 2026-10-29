import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { cn } from "@/core/utils/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

/** `<select>` nativo con la misma etiqueta, error y ayuda que `Input`. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ label, error, helperText, className, id, children, ...props }, ref) => {
		const generado = useId();
		const selectId = id ?? generado;
		const descripcion = error
			? `${selectId}-error`
			: helperText
				? `${selectId}-helper`
				: undefined;

		return (
			<div className="w-full space-y-1.5">
				{label && (
					<label
						htmlFor={selectId}
						className="block text-[13px] font-medium text-tinta-suave"
					>
						{label}
					</label>
				)}
				<select
					ref={ref}
					id={selectId}
					aria-invalid={!!error}
					aria-describedby={descripcion}
					className={cn(
						"h-9 w-full cursor-pointer rounded-md border bg-superficie px-2.5 text-sm text-tinta transition-colors",
						"focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20",
						"disabled:cursor-not-allowed disabled:opacity-50",
						error
							? "border-rose-500/80"
							: "border-borde hover:border-borde-fuerte",
						className,
					)}
					{...props}
				>
					{children}
				</select>
				{error && (
					<p
						id={`${selectId}-error`}
						className="text-xs font-medium text-rose-400"
					>
						{error}
					</p>
				)}
				{!error && helperText && (
					<p id={`${selectId}-helper`} className="text-xs text-tinta-tenue">
						{helperText}
					</p>
				)}
			</div>
		);
	},
);

Select.displayName = "Select";
