import { useState } from "react";

interface MermaidDiagramProps {
	version: string;
	id: string;
	source: string;
}

export function MermaidDiagram({ version, id, source }: MermaidDiagramProps) {
	const [failed, setFailed] = useState(false);
	const image = `/whitepaper/diagrams/${encodeURIComponent(version)}/${encodeURIComponent(id)}.svg`;

	return (
		<figure className="wp-diagram">
			{failed ? (
				<div className="wp-diagram-error">架构图资源未生成。Mermaid 源码仍保留在当前版本 Markdown 中。</div>
			) : (
				<a href={image} target="_blank" rel="noreferrer" className="wp-diagram-canvas" aria-label="打开架构图原图">
					<img src={image} alt="DSH architecture diagram" loading="lazy" onError={() => setFailed(true)} />
				</a>
			)}
			<figcaption>
				<span>Mermaid source · {id}</span>
				<details>
					<summary>查看源码</summary>
					<pre><code>{source}</code></pre>
				</details>
			</figcaption>
		</figure>
	);
}
