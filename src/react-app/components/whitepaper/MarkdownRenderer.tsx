interface MarkdownRendererProps {
	html: string;
}

/**
 * Whitepaper HTML is generated at build time from repository-owned Markdown.
 * The content validator rejects raw HTML and non-approved link targets before
 * this component receives the generated output.
 */
export function MarkdownRenderer({ html }: MarkdownRendererProps) {
	return <div className="wp-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
