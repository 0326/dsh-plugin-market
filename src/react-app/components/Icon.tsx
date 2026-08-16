import type { ComponentType } from "react";
import {
	IconArrowsExchange,
	IconBallBasketball,
	IconBrandGithub,
	IconCheck,
	IconClock,
	IconCompass,
	IconCopy,
	IconExternalLink,
	IconHistory,
	IconLanguage,
	IconLayoutGrid,
	IconMoon,
	IconSearch,
	IconSend,
	IconShield,
	IconShieldExclamation,
	IconStar,
	IconStarFilled,
	IconSun,
	IconUser,
	IconVersions,
	type IconProps,
} from "@tabler/icons-react";

export type IconName =
	| "search"
	| "sun"
	| "moon"
	| "language"
	| "github"
	| "star"
	| "star-filled"
	| "check"
	| "exchange"
	| "shield"
	| "shield-alert"
	| "copy"
	| "clock"
	| "user"
	| "compass"
	| "layout"
	| "history"
	| "versions"
	| "send"
	| "external-link"
	| "ball-basketball";

const ICONS: Record<IconName, ComponentType<IconProps>> = {
	search: IconSearch,
	sun: IconSun,
	moon: IconMoon,
	language: IconLanguage,
	github: IconBrandGithub,
	star: IconStar,
	"star-filled": IconStarFilled,
	check: IconCheck,
	exchange: IconArrowsExchange,
	shield: IconShield,
	"shield-alert": IconShieldExclamation,
	copy: IconCopy,
	clock: IconClock,
	user: IconUser,
	compass: IconCompass,
	layout: IconLayoutGrid,
	history: IconHistory,
	versions: IconVersions,
	send: IconSend,
	"external-link": IconExternalLink,
	"ball-basketball": IconBallBasketball,
};

export function Icon({
	name,
	size = 18,
	stroke = 1.75,
	className,
}: {
	name: IconName;
	size?: number;
	stroke?: number;
	className?: string;
}) {
	const C = ICONS[name];
	return <C size={size} stroke={stroke} className={className} aria-hidden="true" />;
}
