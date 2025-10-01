const gameplayArea = document.querySelector("section.gameplay-area");
if (!gameplayArea) {
	throw new Error("Gameplay area not found");
}
gameplayArea.insertAdjacentHTML("beforeend", `<canvas id="solitaire-canvas" class="main-canvas" />`);

/** @type {HTMLCanvasElement} */
const cnv = document.querySelector("canvas#solitaire-canvas");
if (!cnv) {
	throw new Error("Unable to create canvas");
}

const CELL_INVALID = 0;
const CELL_EMPTY = 1;
const CELL_MARBLE = 2;
const scale = 1;

cnv.width = 280 * scale;
cnv.height = 190 * scale;
const boardCenterXY = cnv.height/2;

const ctx = cnv.getContext("2d");
if (!ctx) {
	throw new Error("Canvas context not found");
}
ctx.imageSmoothingEnabled = false;

const cellsWH = 9;
const marbleRadius = cnv.height / 34;
const field = new Array(cellsWH).fill([]).map(() => new Array(cellsWH).fill(2));
let eliminated = 0;

function resetField() {
	eliminated = 0;
	for(let i = 0; i < cellsWH; i++) {
		for(let j = 0; j < cellsWH; j++) {
			field[i][j] = (
				i < 3 && j < 3 || // upper left
				i < 3 && j > 5 || // upper right
				i > 5 && j < 3 || // lower left
				i > 5 && j > 5    // lower right
			) ? CELL_INVALID : CELL_MARBLE;
		}
	}
	field[4][4] = CELL_EMPTY; // center marble, starts empty
	ctx.clearRect(0, 0, cnv.width, cnv.height);
	updateCanvas();
}

function drawCircle(x, y, radius, fillStyle, strokeStyle = "transparent") {
	const tmpShadowColor = ctx.shadowColor;
	ctx.beginPath();
	ctx.fillStyle = fillStyle;
	ctx.strokeStyle = strokeStyle;
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
	if(strokeStyle !== "transparent") {
		ctx.shadowColor = "transparent";
		ctx.stroke();
	}
	ctx.shadowColor = tmpShadowColor;
}

function drawButton(x, y, width, height, text) {
	ctx.fillStyle = "blue";
	ctx.strokeStyle = "black";
	ctx.shadowColor = "transparent";
	ctx.lineWidth = 1;
	ctx.fillRect(x, y, width, height);
	ctx.strokeRect(x, y, width, height);

	ctx.fillStyle = "cyan";
	ctx.font = `12pt sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(text, x + width / 2, y + height / 2);
}

function drawCell(x, y, radius, marbleState) {
	const shadowColor = ctx.shadowColor;
	const shadowOffset = ctx.shadowOffsetX;
	if (marbleState == CELL_EMPTY) {
		ctx.shadowColor = "cyan";
		ctx.shadowOffsetX = ctx.shadowOffsetY = 1;
		drawCircle(x+(1*scale), y + (1*scale), (radius + scale), "black");
		drawCircle(x+(2*scale), y + (2*scale), radius, "blue");
		ctx.shadowColor = "transparent";
	} else if (marbleState == CELL_MARBLE) {
		// main circle
		ctx.shadowColor = "black";
		ctx.shadowOffsetX = ctx.shadowOffsetY = scale;
		drawCircle(x, y, radius, marbleState === 2 ? "cyan" : "black");
		ctx.shadowColor = "transparent";
	
		// specular highlight and shadow
		ctx.shadowColor = "blue";
		ctx.shadowOffsetX = ctx.shadowOffsetY = scale*4;
		if(marbleState == 2) {
			drawCircle(x - radius / 3, y - radius / 3, radius / 2, "white");
		}
	}
	ctx.shadowColor = shadowColor;
	ctx.shadowOffsetX = ctx.shadowOffsetY = shadowOffset;
}

function updateCanvas() {
	ctx.shadowColor = "gray";
	ctx.shadowOffsetX = 5*scale;
	ctx.shadowOffsetY = 5*scale;
	ctx.lineWidth = 1;
	drawCircle(boardCenterXY, boardCenterXY, (cnv.height-15)/2, "blue", "cyan"); // main board
	ctx.shadowColor = "transparent";

	drawCircle(boardCenterXY, boardCenterXY, (cnv.height-30)/2, "blue", "cyan"); // inner circle

	// draw field
	for(let y = 0; y < cellsWH; y++) {
		for(let x = 0; x < cellsWH; x++) {
			const marbleState = field[y][x];
			if(marbleState === CELL_INVALID) continue;
			const cellX = boardCenterXY + (x - cellsWH/2) * marbleRadius*3 + marbleRadius*1.5;
			const cellY = boardCenterXY + (y - cellsWH/2) * marbleRadius*3 + marbleRadius*1.5;
			drawCell(cellX, cellY, marbleRadius, marbleState);
		}
	}

	const baseEliminatedX = cnv.height+20;
	for(i = 0; i < eliminated; i++) {
		let x = i % 5;
		let y = Math.floor((i - x) / 5);
		drawCell(baseEliminatedX + x * marbleRadius*2, y * marbleRadius*2+16, marbleRadius*.8, CELL_MARBLE);
	}

	drawButton(cnv.width - 80*scale, cnv.height - 26*scale, 60, 24, "Reset");
}

function mouseCellPos(e) {
	const rect = cnv.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;

	for(let y = 0; y < cellsWH; y++) {
		for(let x = 0; x < cellsWH; x++) {
			if(field[y][x] === CELL_INVALID) continue;
			const cellX = boardCenterXY + (x - cellsWH/2) * marbleRadius*3 + marbleRadius*1.5;
			const cellY = boardCenterXY + (y - cellsWH/2) * marbleRadius*3 + marbleRadius*1.5;
			if(Math.hypot(mouseX - cellX, mouseY - cellY) <= marbleRadius) {
				return {x, y};
			}
		}
	}
	return {x: -1, y: -1};
}

let activeX = -1;
let activeY = -1;
cnv.onmousedown = (e) => {
	const rect = cnv.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	if(mouseX >= cnv.width - 80*scale && mouseX <= cnv.width - 80*scale+60 && mouseY >= cnv.height - 26*scale && mouseY <= cnv.height - 26*scale+24) {
		resetField();
		return;
	}

	const cellPos = mouseCellPos(e);
	if(cellPos.x < 0 || cellPos.x >= cellsWH || cellPos.y < 0 || cellPos.y >= cellsWH || field[cellPos.y][cellPos.x] !== CELL_MARBLE) {
		activeX = -1;
		activeY = -1;
	} else {
		activeX = cellPos.x;
		activeY = cellPos.y;
	}
	updateCanvas();
};

function clearActiveMarble() {
	activeX = -1;
	activeY = -1;
	updateCanvas();
}
cnv.onmouseout = clearActiveMarble;


cnv.onmouseup = (e) => {
	const cellPos = mouseCellPos(e);
	if(cellPos.x < 0 || cellPos.x >= cellsWH || cellPos.y < 0 || cellPos.y >= cellsWH) {
		clearActiveMarble();
		return;
	}
	if(cellPos.x == activeX + 2 && field[activeY][activeX+1] == CELL_MARBLE && field[activeY][activeX+2] == CELL_EMPTY) {
		// to the right
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY][activeX+1] = CELL_EMPTY;
		field[activeY][activeX+2] = CELL_MARBLE;
		eliminated++;
	} else if(cellPos.x == activeX - 2 && field[activeY][activeX-1] == CELL_MARBLE && field[activeY][activeX-2] == CELL_EMPTY) {
		// to the left
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY][activeX-1] = CELL_EMPTY;
		field[activeY][activeX-2] = CELL_MARBLE;
		eliminated++;
	} else if(cellPos.y == activeY + 2 && field[activeY+1][activeX] == CELL_MARBLE && field[activeY+2][activeX] == CELL_EMPTY) {
		// down
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY+1][activeX] = CELL_EMPTY;
		field[activeY+2][activeX] = CELL_MARBLE;
		eliminated++;
	} else if(cellPos.y == activeY - 2 && field[activeY-1][activeX] == CELL_MARBLE && field[activeY-2][activeX] == CELL_EMPTY) {
		// up
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY-1][activeX] = CELL_EMPTY;
		field[activeY-2][activeX] = CELL_MARBLE;
		eliminated++;
	}
	clearActiveMarble();
	updateCanvas();
};

resetField();