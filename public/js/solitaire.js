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
/** @type {number[][]} */
const field = new Array(fieldWidthHeight).fill([]).map(() => new Array(fieldWidthHeight).fill(2));

function resetField() {
	for(let i = 0; i < 3; i++) {
		for(let j = 0; j < 3; j++) {
			field[i][j] = CELL_INVALID; // top left area
			field[i][fieldWidthHeight - 1 - j] = CELL_INVALID; // top right area
			field[fieldWidthHeight - 1 - i][j] = CELL_INVALID; // bottom left area
			field[fieldWidthHeight - 1 - i][fieldWidthHeight - 1 - j] = CELL_INVALID; // bottom right area

			// reset all other cells to marble
			field[i][3] = CELL_MARBLE;
			field[i][4] = CELL_MARBLE;
			field[i][5] = CELL_MARBLE;
			field[3][i] = CELL_MARBLE;
			field[4][i] = CELL_MARBLE;
			field[5][i] = CELL_MARBLE;

			field[fieldWidthHeight - 1 - i][3] = CELL_MARBLE;
			field[fieldWidthHeight - 1 - i][4] = CELL_MARBLE;
			field[fieldWidthHeight - 1 - i][5] = CELL_MARBLE;
			field[3][fieldWidthHeight - 1 - i] = CELL_MARBLE;
			field[4][fieldWidthHeight - 1 - i] = CELL_MARBLE;
			field[5][fieldWidthHeight - 1 - i] = CELL_MARBLE;

		}
	}
	// center area
	field[3][3] = CELL_MARBLE;
	field[3][4] = CELL_MARBLE;
	field[3][5] = CELL_MARBLE;
	field[4][3] = CELL_MARBLE;
	field[4][5] = CELL_MARBLE;
	field[5][3] = CELL_MARBLE;
	field[5][4] = CELL_MARBLE;
	field[5][5] = CELL_MARBLE;
	field[4][4] = CELL_EMPTY;
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
	ctx.fillStyle = "white";
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
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.arc(cnv.width/2, cnv.height/2, (cnv.height-30)/2, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

	// draw field
	const marbleRadius = cnv.height / 1.2 / fieldWidthHeight;
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


// if activeX and activeY > -1, field[activeY][activeX] is the marble currently being dragged, and set to -1 on release
let activeX = -1;
let activeY = -1;
cnv.onmousedown = (e) => {
	const rect = cnv.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	console.log(`Mouse clicked at: ${mouseX}, ${mouseY}`);
	if(mouseX >= cnv.width - 160 && mouseX <= cnv.width - 80 && mouseY >= cnv.height - 40 && mouseY <= cnv.height - 10) {
		// reset button clicked
		console.log("Reset button clicked");
		resetField();
		return;
	}

	const marbleRadius = cnv.height / 1.2 / fieldWidthHeight;
	for(let y = 0; y < fieldWidthHeight; y++) {
		for(let x = 0; x < fieldWidthHeight; x++) {
			const marbleState = field[y][x];
			if(marbleState === 0) continue; // skip non-hole cells
			const cellX = x * marbleRadius + cnv.width / 2 - (fieldWidthHeight * marbleRadius) / 2;
			const cellY = y * marbleRadius + cnv.height / 2 - (fieldWidthHeight * marbleRadius) / 2;
			const dist = Math.sqrt((mouseX - (cellX + (marbleRadius / 2)))**2 + (mouseY - (cellY + (marbleRadius / 2)))**2);
			if(dist <= (marbleRadius - 10) / 2) {
				console.log(`Clicked on marble at field position: ${x}, ${y} with state ${marbleState}`);
				// toggle marble state for demo purposes
				if(marbleState === 2) {
					field[y][x] = 1; // make empty
				} else if(marbleState === 1) {
					field[y][x] = 2; // make marble
				}
				drawBoard();
				return;
			}
		}
	}
};

function clearActiveMarble() {
	activeX = -1;
	activeY = -1;
	drawBoard();
}
cnv.onmouseout = clearActiveMarble;

cnv.onmouseup = (e) => {
	console.log("mouseup");
};

resetField();