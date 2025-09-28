import path from "path";
export const basePath = import.meta.env.BASE_PATH ?? "/JavaScriptOnTheBrain/";

export function fixLinks(l: string) {
	if(l.indexOf("://") >= 0) return l;
	return path.normalize(l.replaceAll("$BASE_PATH", basePath));
}

export function prependBasePath(...pathArgs:string[]) {
	if(pathArgs.length == 1 &&  pathArgs[0].indexOf("://") >= 0) return pathArgs[0];
	return path.join(basePath, ...pathArgs);
}