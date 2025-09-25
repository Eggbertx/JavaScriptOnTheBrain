const gameplayArea = document.querySelector("section#gameplay-area");
if (!gameplayArea) {
	throw new Error("Gameplay area not found");
}
gameplayArea.insertAdjacentHTML("beforeend", `<canvas id="solitaire-canvas" class="main-canvas" />`);

/** @type {HTMLCanvasElement} */
const cnv = document.querySelector("canvas#solitaire-canvas");
if (!cnv) {
	throw new Error("Canvas element not found");
}

const SHADOW_COLOR = "#444";
const CELL_INVALID = 0;
const CELL_EMPTY = 1;
const CELL_MARBLE = 2;
const scale = 2;

cnv.width = 280 * scale;
cnv.height = 190 * scale;


/** @type {CanvasRenderingContext2D} */
const ctx = cnv.getContext("2d");
if (!ctx) {
	throw new Error("Canvas context not found");
}
ctx.imageSmoothingEnabled = false;

const fieldWidthHeight = 9;
const marbleRadius = cnv.height / 1.2 / fieldWidthHeight;
/** @type {number[][]} */
const field = new Array(fieldWidthHeight).fill([]).map(() => new Array(fieldWidthHeight).fill(2));

function resetField() {
	for(let i = 0; i < fieldWidthHeight; i++) {
		for(let j = 0; j < fieldWidthHeight; j++) {
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
	drawBoard();
}

function drawCircle(x, y, radius, color, strokeColor = "black") {
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = 1;
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.closePath();
}

function drawButton(x, y, width, height, text) {
	ctx.fillStyle = "blue";
	ctx.strokeStyle = "cyan";
	ctx.shadowColor = SHADOW_COLOR;
	ctx.shadowOffsetX = 2;
	ctx.shadowOffsetY = 2;
	ctx.lineWidth = 1;
	ctx.fillRect(x, y, width, height);
	ctx.strokeRect(x, y, width, height);

	ctx.shadowColor = "transparent";
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.fillStyle = "cyan";
	ctx.font = `16pt sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(text, x + width / 2, y + height / 2);
}

function drawCell(x, y, radius, marbleState) {
	// main circle
	drawCircle(x, y, radius, marbleState === 2 ? "cyan" : "black");

	// specular highlight and shadow
	if(marbleState == 2) {
		drawCircle(x - radius / 3, y - radius / 3, radius / 2, "white", "transparent");
		drawCircle(x + radius / 3, y + radius / 3, radius / 3, "blue", "transparent");
	}
}

function drawBoard() {
	ctx.shadowColor = SHADOW_COLOR;
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 5;
	ctx.shadowOffsetY = 5;

	ctx.lineWidth = 3;
	drawCircle(cnv.width/2, cnv.height/2, (cnv.height-15)/2, "blue", "cyan");

	ctx.shadowColor = "transparent";
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	// inner circle
	drawCircle(cnv.width/2, cnv.height/2, (cnv.height-30)/2, "blue", "cyan");

	// draw field
	for(let y = 0; y < fieldWidthHeight; y++) {
		for(let x = 0; x < fieldWidthHeight; x++) {
			const marbleState = field[y][x];
			if(marbleState === 0) continue; // skip non-hole cells
			const cellX = x * marbleRadius + cnv.width / 2 - (fieldWidthHeight * marbleRadius) / 2;
			const cellY = y * marbleRadius + cnv.height / 2 - (fieldWidthHeight * marbleRadius) / 2;
			drawCell(cellX + (marbleRadius / 2), cellY + (marbleRadius / 2), (marbleRadius - 10) / 2, marbleState);
		}
	}

	drawButton(cnv.width - 160, cnv.height - 40, 80, 30, "Reset");
}

function mouseCellPos(e) {
	const rect = cnv.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	const cellX = Math.floor((mouseX - (cnv.width / 2 - (fieldWidthHeight * marbleRadius) / 2)) / marbleRadius);
	const cellY = Math.floor((mouseY - (cnv.height / 2 - (fieldWidthHeight * marbleRadius) / 2)) / marbleRadius);
	return {x: cellX, y: cellY};
}

// if activeX and activeY > -1, field[activeY][activeX] is the marble currently being dragged, and set to -1 on release
let activeX = -1;
let activeY = -1;
cnv.onmousedown = (e) => {
	const rect = cnv.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	if(mouseX >= cnv.width - 160 && mouseX <= cnv.width - 80 && mouseY >= cnv.height - 40 && mouseY <= cnv.height - 10) {
		resetField();
		return;
	}

	const cellPos = mouseCellPos(e);
	if(cellPos.x < 0 || cellPos.x >= fieldWidthHeight || cellPos.y < 0 || cellPos.y >= fieldWidthHeight || field[cellPos.y][cellPos.x] !== CELL_MARBLE) {
		activeX = -1;
		activeY = -1;
	} else {
		activeX = cellPos.x;
		activeY = cellPos.y;
	}
	drawBoard();
};

function clearActiveMarble() {
	activeX = -1;
	activeY = -1;
	drawBoard();
}
cnv.onmouseout = clearActiveMarble;


cnv.onmouseup = (e) => {
	const cellPos = mouseCellPos(e);
	if(cellPos.x < 0 || cellPos.x >= fieldWidthHeight || cellPos.y < 0 || cellPos.y >= fieldWidthHeight) {
		clearActiveMarble();
		return;
	}
	if(cellPos.x == activeX + 2 && field[activeY][activeX+1] == CELL_MARBLE && field[activeY][activeX+2] == CELL_EMPTY) {
		// to the right
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY][activeX+1] = CELL_EMPTY;
		field[activeY][activeX+2] = CELL_MARBLE;
	} else if(cellPos.x == activeX - 2 && field[activeY][activeX-1] == CELL_MARBLE && field[activeY][activeX-2] == CELL_EMPTY) {
		// to the left
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY][activeX-1] = CELL_EMPTY;
		field[activeY][activeX-2] = CELL_MARBLE;
	} else if(cellPos.y == activeY + 2 && field[activeY+1][activeX] == CELL_MARBLE && field[activeY+2][activeX] == CELL_EMPTY) {
		// down
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY+1][activeX] = CELL_EMPTY;
		field[activeY+2][activeX] = CELL_MARBLE;
	} else if(cellPos.y == activeY - 2 && field[activeY-1][activeX] == CELL_MARBLE && field[activeY-2][activeX] == CELL_EMPTY) {
		// up
		field[activeY][activeX] = CELL_EMPTY;
		field[activeY-1][activeX] = CELL_EMPTY;
		field[activeY-2][activeX] = CELL_MARBLE;
	}
	clearActiveMarble();
	drawBoard();
};

resetField();