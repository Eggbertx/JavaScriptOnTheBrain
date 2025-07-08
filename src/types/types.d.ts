interface GameListItem {
	name: string;
	link: string;
	originalDate?: string;
	shortDesc: string;
	newShortDesc?: string;
	gameScripts?: RuntimeScript[];
	gamePageDescriptionHTML?: string;
	newGamePageDescriptionHTML?: string;

	gameID?: string; // set by [game].astro, not in the JSON file
}

interface RuntimeScript {
	src: string;
	type?: string;
	async?: boolean;
	defer?: boolean;
}