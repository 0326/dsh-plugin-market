import type { ReactNode } from "react";

export function ContentSection({
	kicker,
	title,
	answer,
	actions,
	children,
	className = "",
}: {
	kicker: string;
	title: string;
	answer?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
	className?: string;
}) {
	return (
		<section className={`content-section ${className}`.trim()}>
			<div className="content-section-copy">
				<p className="content-kicker">{kicker}</p>
				<h2>{title}</h2>
				{answer && <div className="direct-answer">{answer}</div>}
				{actions && <div className="content-actions">{actions}</div>}
			</div>
			{children && <div className="content-section-body">{children}</div>}
		</section>
	);
}

export function DirectAnswer({ children }: { children: ReactNode }) {
	return <div className="direct-answer">{children}</div>;
}

export function FactList({ items }: { items: { label: string; value: ReactNode; note?: string }[] }) {
	return (
		<dl className="fact-list">
			{items.map((item) => (
				<div key={item.label} className="fact-row">
					<dt>{item.label}</dt>
					<dd>
						<strong>{item.value}</strong>
						{item.note && <span>{item.note}</span>}
					</dd>
				</div>
			))}
		</dl>
	);
}

export function EvidenceBlock({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="evidence-block">
			<span>{label}</span>
			<div>{children}</div>
		</div>
	);
}

export function RelatedLinks({ links }: { links: { href: string; label: string }[] }) {
	return (
		<nav className="related-links" aria-label="Related">
			{links.map((link) => (
				<a key={link.href} href={link.href}>{link.label}<span aria-hidden="true">↗</span></a>
			))}
		</nav>
	);
}

export function LastUpdated({ label, value, dateTime }: { label: string; value: string; dateTime?: string }) {
	return (
		<p className="last-updated">
			<span>{label}</span>
			<time dateTime={dateTime}>{value}</time>
		</p>
	);
}

export interface FAQItem {
	question: string;
	answer: ReactNode;
}

export function FAQ({ title, items }: { title: string; items: FAQItem[] }) {
	return (
		<section className="faq-section">
			<div className="faq-heading">
				<p className="content-kicker">FAQ</p>
				<h2>{title}</h2>
			</div>
			<div className="faq-list">
				{items.map((item, index) => (
					<article key={item.question} className="faq-item">
						<span className="faq-index">{String(index + 1).padStart(2, "0")}</span>
						<div>
							<h3>{item.question}</h3>
							<div className="faq-answer">{item.answer}</div>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
