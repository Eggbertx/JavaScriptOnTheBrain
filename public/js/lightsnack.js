console.log("A Light Snack script loaded");

const gameplayArea = document.querySelector("section#gameplay-area");
if (!gameplayArea) {
	throw new Error("Gameplay area not found");
}
gameplayArea.insertAdjacentHTML("beforeend", `<canvas id="frog-canvas" class="main-canvas" />`);

/** @type {HTMLCanvasElement} */
const cnv = document.querySelector("canvas#frog-canvas");
if (!cnv) {
	throw new Error("Canvas element not found");
}
cnv.width = 400;
cnv.height = 60;

const debug = window.debugGames || false;

/** @type {CanvasRenderingContext2D} */
const ctx = cnv.getContext("2d");
if (!ctx) {
	throw new Error("Canvas context not found");
}
ctx.imageSmoothingEnabled = false;

const faceFrames = [0, 1, 2, 3, 2, 1, 0];
let currentFrogFrame = 0;
let frogFrameModulus = 5;

const maxFlies = 5;
const fliesSY = 220;
const flyFrames = [
	{sx: 2, sw: 9},
	{sx: 13, sw: 13},
	{sx: 30, sw: 9},
]
const fliesSH = 8;
const flies = [];
let dangerX = 0; // (eatenX:dangerX] = frog animation starts to speed up
let eatenX = 0; // [0:eatenX] = fly is eaten
let eatingFly = -1; // index of the fly being eaten, -1 if none
let eatingFlySW = 0;

const frogBase = new Image();
frogBase.onload = () => {
	for(let i = 0; i < maxFlies; i++) {
		flies.push({
			x: randBetween(frogBase.width+40, cnv.width - 13*2),
			y: randBetween(0, cnv.height - fliesSH),
			beingEaten: false,
		});
	}
	eatenX = frogBase.width + 30; // where the frog switches to eating animation and removes the fly
	dangerX = eatenX + 30; // where the frog's speed increases
	setInterval(drawCanvas, 1000 / 20); // 5 FPS
}
frogBase.src = "/img/froggies.gif";


function randBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function debugFrame(x, y, w, h, strokeStyle, fillStyle = "", text = "") {
	if(debug) {
		ctx.strokeStyle = strokeStyle;
		if(fillStyle != "")
			ctx.fillStyle = fillStyle;
		ctx.strokeRect(x, y, w, h);
		if(fillStyle != "")
			ctx.fillRect(x, y, w, h);
		if(text) {
			ctx.fillText(text, x + 2, y + 12);
		}
	}
}

function drawFrog(frame = -1) {
	// frog base sprite
	let sx = 0;
	let sy = 0;
	let sw = 96;
	let sh = 64;
	let dx = 0;
	let dy = 0;
	let dw = sw;
	let dh = sh;
	ctx.drawImage(frogBase, sx, sy, sw, sh, dx, dy, dw, dh);
	debugFrame(dx, dy, dw, dh-4, "green", "");
	if(frame < 0 || frame > 3) {
		return; // no face sprite to draw
	}

	// frog face sprite
	sx = (frame % 2 == 0)?0:frogBase.width / 2;
	const syBase = (eatingFly > -1)?140:60;
	sy = syBase + Math.floor(frame / 2) * 40; // 60 or 100 for normal, 140 or 180 for eating
	sw = frogBase.width / 2;
	sh = 40;
	dx = 48;
	dy = 0;
	dw = sw;
	dh = sh;
	ctx.clearRect(dx, dy, sw, sh-6);

	// draw tongue if frog is eating a fly
	if(eatingFly > -1 && flies[eatingFly]) {
		const fly = flies[eatingFly];
		// draw tongue as a line
		ctx.strokeStyle = "red";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(frogBase.width-32, cnv.height / 3); // tongue goes to the left side of the canvas
		ctx.lineTo(fly.x + eatingFlySW / 2, fly.y + fliesSH / 2);
		ctx.stroke();
	}

	ctx.drawImage(frogBase, sx, sy, sw, sh, dx, dy, dw, dh);
	debugFrame(dx, dy, dw, dh-4, "black", "", `Frame: ${frame}  (${sx},${sy})`);
}

function anyFliesInDangerZone() {
	return flies.some(fly => fly && fly.x > eatenX && fly.x <= dangerX);
}



function drawFlies() {
	for (const f in flies) {
		const fly = flies[f];
		if(!fly) continue; // fly is eaten
		const frameIndex = Math.floor(Math.random() * flyFrames.length);
		const sx = flyFrames[frameIndex].sx;
		const sw = flyFrames[frameIndex].sw;
		ctx.drawImage(frogBase, sx, fliesSY, sw, fliesSH, fly.x, fly.y, sw, fliesSH);

		if(!fly.beingEaten) {
			// if fly is being eaten, it is "stuck" until removed
			// flies[f].x += randBetween(-8, 8);
			flies[f].x += randBetween(-4, 2);
			flies[f].y += randBetween(-2, 2);
		}

		if(fly.x <= eatenX && eatingFly == -1) {
			// frog is eating the fly, change the animation and reset the modulus
			eatingFly = f;
			eatingFlySW = sw;
			flies[f].beingEaten = true;
			currentFrogFrame = 0; // reset frog frame to start eating animation
		}

		// bounds checking
		if (fly.x < 0)
			flies[f].x = 0;
		if (fly.x > cnv.width - sw)
			flies[f].x = cnv.width - sw;
		if (fly.y < 0)
			flies[f].y = 0;
		if (fly.y > cnv.height - fliesSH)
			flies[f].y = cnv.height - fliesSH;

		debugFrame(fly.x, fly.y, sw, fliesSH, "green", "", `Fly ${parseInt(f) + 1}`)
	}
}

let frameCount = 0;
function drawCanvas() {
	ctx.clearRect(0, 0, cnv.width, cnv.height); // clear the canvas
	if((frameCount++ % frogFrameModulus) == 0) {
		if(currentFrogFrame++ >= faceFrames.length) {
			if(eatingFly > -1) {
				// reset eating animation
				currentFrogFrame = 0;
				flies[eatingFly] = null;
				eatingFly = -1; // reset eating fly
			}
			currentFrogFrame = 0;
		}
		if(currentFrogFrame == 1) {
			// mouth closed, remove fly
			flies[eatingFly] = null;
		}
	}
	let someFliesInDangerZone = anyFliesInDangerZone();

	if(eatingFly > -1) {
		frogFrameModulus = 10;
	} else if(someFliesInDangerZone) {
		frogFrameModulus = 2;
	} else {
		frogFrameModulus = 5;
	}

	if(debug) {
		ctx.strokeStyle = "green";
		ctx.strokeText(`Modulus: ${frogFrameModulus}, eatingFly: ${eatingFly}`, cnv.width/2 - 32, cnv.height-4);

		// draw "danger zone", where the frog's speed increases but the fly is still "alive"
		debugFrame(eatenX, 0, dangerX - eatenX, cnv.height, "orange", "", `Danger Zone: ${eatenX} to ${dangerX}`);

		// draw "eaten zone", where the frog switches to eating animation and removes the fly
		debugFrame(0, 0, eatenX, cnv.height, "red", "", `Eaten Zone: 0 to ${eatenX}`);
	}
	let frameIndex = faceFrames[currentFrogFrame];
	drawFrog(frameIndex);
	drawFlies();
}