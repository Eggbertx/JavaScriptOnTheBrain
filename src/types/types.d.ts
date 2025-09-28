interface GameListItem {
	name: string;
	link: string;
	originalDate?: string;
	shortDesc: string;
	newShortDesc?: string;
	gameScripts?: RuntimeScript[];
	gamePageDescriptionHTML?: string;
	newGamePageDescriptionHTML?: string;
	gameLinks?: GameLink[];
	gameLinksHorizontal?: boolean;

	gameID?: string; // set by [game].astro, not in the JSON file
}

interface RuntimeScript {
	src: string;
	type?: string;
	async?: boolean;
	defer?: boolean;
}

type ActiveTab = "Intro" | "Games" | "Goals" | "Feedback" | "Links" | "none";

interface JSOTBConfig {
	basePath: string;
	activePage: string;
	activeTab: ActiveTab;
}

interface GameLink {
	text: string;
	href: string;
	icon: string;
}

declare global {
	interface Window {
		debugGames?: boolean;
		JSOTB: JSOTBConfig;
	}
}