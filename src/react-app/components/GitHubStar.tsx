import { useI18n } from "../lib/i18n";
import { Icon } from "./Icon";

const REPO_URL = "https://github.com/0326/dsh-plugin-market";
export function GitHubStar() {
	const { t } = useI18n();

	return (
		<a
			className="btn btn-square btn-ghost btn-sm border border-base-content"
			href={REPO_URL}
			target="_blank"
			rel="noreferrer"
			aria-label={t("github.starAria")}
		>
			<Icon name="github" size={18} stroke={2} />
		</a>
	);
}
