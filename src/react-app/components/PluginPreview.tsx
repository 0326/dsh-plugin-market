import { useState } from "react";

/**
 * Repository social preview (Open Graph) image with a kun.png fallback when
 * no preview exists or the image fails to load.
 */
export function PluginPreview({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
	const [failed, setFailed] = useState(false);
	const hasPreview = Boolean(src) && !failed;
	const shown = hasPreview ? (src as string) : "/kun.png";
	return (
		<div className={"plugin-preview " + className}>
			<img
				key={shown}
				src={shown}
				alt={alt}
				loading="lazy"
				referrerPolicy="no-referrer"
				className={hasPreview ? "object-cover" : "is-fallback object-contain"}
				onError={hasPreview ? () => setFailed(true) : undefined}
			/>
		</div>
	);
}
