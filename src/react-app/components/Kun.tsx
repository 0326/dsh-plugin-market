/** The shared Kun brand asset used by the app chrome and hero. */
export function Kun({ className = "", ariaHidden = false }: { className?: string; ariaHidden?: boolean }) {
	return <img className={className} src="/kun.png" alt={ariaHidden ? "" : "Kun — dsh-plugin market mascot"} aria-hidden={ariaHidden || undefined} />;
}
