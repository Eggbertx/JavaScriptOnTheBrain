const gameplayArea = document.querySelector("section.gameplay-area");
if(!gameplayArea) {
	throw new Error("Gameplay area not found");
}
gameplayArea.insertAdjacentHTML("beforeend", `<canvas id="frog-canvas" class="main-canvas" />`);

/** @type {HTMLCanvasElement} */
const cnv = document.querySelector("canvas#frog-canvas");
if(!cnv) {
	throw new Error("Canvas element not found");
}
cnv.width = 500;
cnv.height = 60;

/** @type {CanvasRenderingContext2D} */
const ctx = cnv.getContext("2d");
if(!ctx) {
	throw new Error("Canvas context not found");
}
// ctx.imageSmoothingEnabled = false;

const headList = [0, 1, 2, 3, 2, 1, 0]; // frames used when not eating or tongue out
let headcount = 0.0;
let currHead = 0;

let currentFrogFrame = 0;
let frogFrameModulus = 5;

const fliesSY = 220;
const flyFrames = [
	{sx: 2, sw: 9},
	{sx: 13, sw: 13},
	{sx: 30, sw: 9},
];
const fliesSH = 8;

const maxFlies = 5;
const flies = [];

let nearX = 500;
let nearY = 0;
let nearNum = -1;

let eatingFlySW = 0;
let eatState = 0; // 0 = normal, 1 = tongue out, 2 = swallowing

let tongue = 0.0;
let eatDx = 0, eatDy = 0;
const tongues = [{x: 18, y: 27}, {x: 22, y: 28}, {x: 0, y: 0}, {x: 0, y: 0}];
let counter = 0;

const imageBase = new Image();
imageBase.onload = () => {
	eatenX = imageBase.width + 30; // where the frog switches to eating animation and removes the fly
	dangerX = eatenX + 30; // where the frog's speed increases
	setInterval(updateCanvas, 75);
	for(let f = 0; f < maxFlies; f++) {
		flies.push({x: 0, y: 0, oldX: 0, oldY: 0, baseX: 0, baseY: 0, dx: 0, dy: 0, alive: false});
	}
}
imageBase.src = (window.JSOTB && window.JSOTB.basePath) ?
	(window.JSOTB.basePath + "/img/froggies.png") :
	"/JavaScriptOnTheBrain/img/froggies.png";
console.log(`Loading frog image from ${imageBase.src}`);


function updateCanvas() {
	counter=(counter+1)% 30;
	nearX=500;
	nearY=0;
	nearNum=-1;
	for (let f = 0; f < 5; f++)
	{
		if(flies[f].alive) {
			// Fly active?
			flies[f].oldX = flies[f].x;
			flies[f].oldY = flies[f].y;
			if(counter==f)		// Pick new homing target
				flies[f].baseX = Math.floor(100 + Math.random() * 400);
			if(counter == (f+10))
				flies[f].baseY = Math.floor(16 + Math.random() * 19);
			if((flies[f].x < flies[f].baseX) && (flies[f].dx < 11)) // Accelerate
				flies[f].dx+=2;
			else if((flies[f].x > flies[f].baseX) && (flies[f].dx > -11))
				flies[f].dx-=2;
			if((flies[f].y < flies[f].baseY) && (flies[f].dy < 7))
				flies[f].dy+=2;
			else if((flies[f].y > flies[f].baseY) && (flies[f].dy > -7))
				flies[f].dy -= 2;
			flies[f].x += flies[f].dx; // Update location
			flies[f].y += flies[f].dy;
			if(flies[f].x < nearX) {
				// See if this one is nearest to frog
				nearX = flies[f].x;
				nearY = flies[f].y;
				nearNum = f;
			}
		}
		else {
			// Fly inactive?
			if(Math.random()<0.01) // Start new one?
			{
				flies[f].x = 500;
				flies[f].y = 25;
				flies[f].baseY = 25;
				flies[f].dx = 0;
				flies[f].dy = 0;
				flies[f].alive = true;
			}
		}
	}
	switch (eatState)
	{
		case 0: // Normal
			headcount += 0.003 * (700 - nearX); // Breathe faster when fly is close
			if(headcount > 12)
				headcount -= 6;
			currHead = headList[Math.floor(headcount) % 6];

			if((nearX > 96) && (nearX < 130) && (nearY < 40) && (nearY > 6)) {
				// Catch?
				eatState = 1;
				eatDx = nearX - 59;
				eatDy = nearY - 22;
				tongue = 1;
				flies[nearNum].alive = false;
				currHead = 4;
			}
			break;
		case 1: // Tongue out
			tongue = tongue - 0.3;
			if(tongue < 0) {
				eatState = 2;
				headcount = 0;
				currHead = 5;
			}
			break;
		case 2: // Swallowing
			headcount += 0.1;
			if(headcount < 0.6)
				currHead = 5;
			else if(headcount < 3.3)
				currHead = 6 + ((Math.floor(headcount * 2)) & 1);
			else if(headcount < 4.4)
				currHead = 5;
			else
				eatState = 0;
			break;
		default:
			break;
	}

	drawCanvas();
}

function drawCanvas() {
	ctx.clearRect(0, 0, cnv.width, cnv.height);

	// draw the frog base sprite
	let sx = 0;
	let sy = 0;
	let sw = 96;
	let sh = 64;
	let dx = 0;
	let dy = 0;
	let dw = sw;
	let dh = sh;
	ctx.drawImage(imageBase, sx, sy, sw, sh, dx, dy, dw, dh);
	
	// frog face sprite
	if(currHead < 0 || currHead >= 8) {
		return; // no face sprite to draw
	}

	sx = (currHead % 2 == 0)?0:imageBase.width / 2;
	sy = 60 + Math.floor(currHead / 2) * 40; // 60, 60, 100, 100, 140, 140, 180, 180
	sw = imageBase.width / 2;
	sh = 40;
	ctx.clearRect(48, 0, sw, sh - 6);
	ctx.drawImage(imageBase, sx, sy, sw, sh, 48, 0, sw, sh);

	if(eatState == 1) {
		// draw tongue
		tongues[2].x = Math.floor(18 + tongue * eatDx);
		tongues[2].y = Math.floor(27 + tongue * eatDy);
		tongues[3].x = tongues[2].x;
		tongues[3].y = Math.floor(25 + tongue * eatDy);
		ctx.fillStyle = "#ff8080"; // original uses #ffafaf but it doesn't show up in grayscale
		ctx.beginPath();
		ctx.moveTo(tongues[0].x + 42, tongues[0].y);
		for (const te of tongues) {
			ctx.lineTo(te.x + 42, te.y);
		}
		ctx.closePath();
		ctx.fill();
		
		// captured fly
		const flyDx = Math.floor(11 + tongue * eatDx) + 42;
		const flyDy = Math.floor(25 + tongue * eatDy);
		sx = flyFrames[0].sx;
		sy = fliesSY;
		sw = flyFrames[0].sw;
		sh = fliesSH;
		dx = flyDx + flyFrames[0].sw;
		dy = flyDy - fliesSH / 2;
		dw = sw;
		dh = sh;
		ctx.drawImage(imageBase, sx, sy, sw, sh, dx, dy, dw, dh);
	}
	flies.filter(f => f.alive).forEach(fly => {
		// draw flies
		const flyFrame = flyFrames[counter & 1];
		sx = flyFrame.sx;
		sy = fliesSY;
		sw = flyFrame.sw;
		sh = fliesSH;
		dx = Math.floor(fly.x);
		dy = Math.floor(fly.y);
		dw = sw;
		dh = sh;
		ctx.drawImage(imageBase, sx, sy, sw, sh, dx, dy, dw, dh);
	});
}