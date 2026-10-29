import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/core/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, helperText, className, id, ...props }, ref) => {
		const inputId =
			id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

		return (
			<div className="w-full space-y-1.5">
				{label && (
					<label
						htmlFor={inputId}
						className="block text-[13px] font-medium text-tinta-suave"
					>
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={cn(
						"h-9 w-full rounded-md border bg-superficie px-3 text-sm text-tinta placeholder:text-tinta-tenue transition-colors",
						"focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20",
						"disabled:cursor-not-allowed disabled:opacity-50",
						error
							? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
							: "border-borde hover:border-borde-fuerte",
						className,
					)}
					aria-invalid={!!error}
					aria-describedby={
						error
							? `${inputId}-error`
							: helperText
								? `${inputId}-helper`
								: undefined
					}
					{...props}
				/>
				{error && (
					<p
						id={`${inputId}-error`}
						className="text-xs text-rose-400 font-medium"
					>
						{error}
					</p>
				)}
				{!error && helperText && (
					<p id={`${inputId}-helper`} className="text-xs text-tinta-tenue">
						{helperText}
					</p>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";
