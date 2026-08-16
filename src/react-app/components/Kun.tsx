/**
 * Kun — the DS Plugin Market mascot (flat vector whale).
 * Brand asset per DESIGN.md: black body, white belly, big round eyes,
 * red blush, yellow mouth, symmetric top fins, whale tail.
 */
export function Kun({ className = "", ariaHidden = false }: { className?: string; ariaHidden?: boolean }) {
	return (
		<svg
			viewBox="0 0 240 180"
			className={className}
			role={ariaHidden ? "presentation" : "img"}
			aria-hidden={ariaHidden || undefined}
			aria-label={ariaHidden ? undefined : "Kun — DS Plugin Market mascot"}
		>
			{/* tail flukes */}
			<path d="M50 82 C 32 56, 5 56, 5 76 C 7 90, 26 94, 48 94 Z" fill="#0b0b0b" />
			<path d="M50 108 C 32 134, 5 134, 5 114 C 7 100, 26 96, 48 96 Z" fill="#0b0b0b" />
			{/* body */}
			<path d="M50 95 C 50 55, 130 42, 195 62 C 226 74, 228 116, 195 130 C 130 152, 50 138, 50 95 Z" fill="#0b0b0b" />
			{/* top fins */}
			<path d="M96 48 C 92 28, 76 24, 72 36 C 70 44, 82 50, 92 52 Z" fill="#0b0b0b" />
			<path d="M140 46 C 138 26, 124 22, 118 31 C 116 39, 128 48, 136 50 Z" fill="#0b0b0b" />
			{/* belly */}
			<path d="M58 104 C 80 130, 164 132, 198 112 C 194 124, 184 138, 166 141 C 130 147, 74 138, 58 110 Z" fill="#ffffff" />
			{/* blush */}
			<ellipse cx="188" cy="102" rx="9" ry="5" fill="#ff4438" />
			<ellipse cx="150" cy="94" rx="6" ry="3.5" fill="#ff4438" />
			{/* eyes */}
			<circle cx="170" cy="74" r="15" fill="#ffffff" />
			<circle cx="136" cy="66" r="9.5" fill="#ffffff" />
			<circle cx="173" cy="76" r="6.5" fill="#0b0b0b" />
			<circle cx="138" cy="68" r="4" fill="#0b0b0b" />
			<circle cx="170" cy="72" r="2.5" fill="#ffffff" />
			<circle cx="135" cy="66" r="1.5" fill="#ffffff" />
			{/* mouth */}
			<path d="M198 110 Q 208 120 220 108" stroke="#ffc928" strokeWidth="4" fill="none" strokeLinecap="round" />
		</svg>
	);
}
