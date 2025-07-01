console.log("Solitaire script loaded");

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

let scale = 2;
// if(window.innerWidth < 280*2 + 20) {
// 	scale = 1;
// }
cnv.width = 280 * scale;
cnv.height = 190 * scale;


/** @type {CanvasRenderingContext2D} */
const ctx = cnv.getContext("2d");
if (!ctx) {
	throw new Error("Canvas context not found");
}
ctx.imageSmoothingEnabled = false;

// initialize field data. 2 = marble, 1 = empty, 0 = not a hole
const fieldWidthHeight = 9;
/** @type {number[][]} */
const field = new Array(fieldWidthHeight).fill([]).map(() => new Array(fieldWidthHeight).fill(2));
for(let i = 0; i < 3; i++) {
	for(let j = 0; j < 3; j++) {
		field[i][j] = 0; // top left area
		field[i][fieldWidthHeight - 1 - j] = 0; // top right area
		field[fieldWidthHeight - 1 - i][j] = 0; // bottom left area
		field[fieldWidthHeight - 1 - i][fieldWidthHeight - 1 - j] = 0; // bottom right area
	}
}
field[4][4] = 1; // center hole

function drawBoard() {
	ctx.shadowColor = "#444";
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 5;
	ctx.shadowOffsetY = 5;

	// main circle
	ctx.beginPath();
	ctx.fillStyle = "blue";
	ctx.strokeStyle = "#00ffff";
	ctx.lineWidth = 3;
	ctx.arc(cnv.width/2, cnv.height/2, (cnv.height-15)/2, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

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
			ctx.beginPath();
			ctx.fillStyle = marbleState === 2 ? "white" : "black";
			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.arc(cellX + (marbleRadius / 2), cellY + (marbleRadius / 2), (marbleRadius - 10) / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		}
	}
}



drawBoard();
