import type { ReactNode } from "react";
import { headingId, stripFrontmatter } from "../../lib/whitepaper";
import { MermaidDiagram } from "./MermaidDiagram";

interface MarkdownRendererProps {
	markdown: string;
	version: string;
}

function inline(text: string): ReactNode[] {
	const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
	const nodes: ReactNode[] = [];
	let cursor = 0;
	let match: RegExpExecArray | null;
	let key = 0;
	while ((match = pattern.exec(text)) !== null) {
		if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
		const token = match[0];
		if (token.startsWith("**")) {
			nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
		} else if (token.startsWith("`")) {
			nodes.push(<code key={key++}>{token.slice(1, -1)}</code>);
		} else {
			const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
			if (link) {
				const external = /^https?:\/\//.test(link[2]);
				nodes.push(<a key={key++} href={link[2]} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{link[1]}</a>);
			}
		}
		cursor = match.index + token.length;
	}
	if (cursor < text.length) nodes.push(text.slice(cursor));
	return nodes;
}

function splitTableRow(line: string): string[] {
	return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
	const cells = splitTableRow(line);
	return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function isListLine(line: string): boolean {
	return /^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
}

function startsBlock(lines: string[], index: number): boolean {
	const line = lines[index] ?? "";
	return /^#{1,4}\s+/.test(line) || line.startsWith("```") || /^>\s?/.test(line) || isListLine(line) || (line.includes("|") && isTableSeparator(lines[index + 1] ?? ""));
}

export function MarkdownRenderer({ markdown, version }: MarkdownRendererProps) {
	const lines = stripFrontmatter(markdown).split(/\r?\n/);
	const blocks: ReactNode[] = [];
	let i = 0;
	let key = 0;

	while (i < lines.length) {
		const line = lines[i];
		if (!line.trim()) {
			i += 1;
			continue;
		}

		if (line.startsWith("```")) {
			const fence = line.slice(3).trim();
			const [language = "", ...attrs] = fence.split(/\s+/);
			const code: string[] = [];
			i += 1;
			while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
			i += 1;
			if (language === "mermaid") {
				const id = attrs.join(" ").match(/id=([\w-]+)/)?.[1] ?? `diagram-${key}`;
				blocks.push(<MermaidDiagram key={key++} version={version} id={id} source={code.join("\n")} />);
			} else {
				blocks.push(<pre key={key++} className="wp-code" data-language={language || "text"}><code>{code.join("\n")}</code></pre>);
			}
			continue;
		}

		const heading = /^(#{1,4})\s+(.+)$/.exec(line);
		if (heading) {
			const level = heading[1].length;
			const text = heading[2].replace(/\s+#+$/, "").trim();
			const id = headingId(text);
			if (level === 1) blocks.push(<h1 key={key++} id={id}>{inline(text)}</h1>);
			else if (level === 2) blocks.push(<h2 key={key++} id={id}>{inline(text)}</h2>);
			else if (level === 3) blocks.push(<h3 key={key++} id={id}>{inline(text)}</h3>);
			else blocks.push(<h4 key={key++} id={id}>{inline(text)}</h4>);
			i += 1;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const quote: string[] = [];
			while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
			blocks.push(<blockquote key={key++}>{quote.map((item, index) => <p key={index}>{inline(item)}</p>)}</blockquote>);
			continue;
		}

		if (isListLine(line)) {
			const ordered = /^\s*\d+\./.test(line);
			const items: string[] = [];
			const pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
			while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern, ""));
			const children = items.map((item, index) => <li key={index}>{inline(item)}</li>);
			blocks.push(ordered ? <ol key={key++}>{children}</ol> : <ul key={key++}>{children}</ul>);
			continue;
		}

		if (line.includes("|") && isTableSeparator(lines[i + 1] ?? "")) {
			const headers = splitTableRow(line);
			i += 2;
			const rows: string[][] = [];
			while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitTableRow(lines[i++]));
			blocks.push(
				<div className="wp-table-wrap" key={key++}>
					<table>
						<thead><tr>{headers.map((cell, index) => <th key={index}>{inline(cell)}</th>)}</tr></thead>
						<tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody>
					</table>
				</div>,
			);
			continue;
		}

		const paragraph = [line.trim()];
		i += 1;
		while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) paragraph.push(lines[i++].trim());
		blocks.push(<p key={key++}>{inline(paragraph.join(" "))}</p>);
	}

	return <div className="wp-markdown">{blocks}</div>;
}
