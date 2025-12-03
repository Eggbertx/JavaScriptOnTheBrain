const gameplayArea = document.querySelector("section.gameplay-area");
if(!gameplayArea) {
	throw new Error("Gameplay area not found");
}
gameplayArea.insertAdjacentHTML("beforeend", `<canvas id="iceblox-canvas" class="main-canvas" tabindex="1" />`);

/** @type {HTMLCanvasElement} */
const cnv = document.querySelector("canvas#iceblox-canvas");
cnv.width = 390;
cnv.height = 350;

const ctx = cnv.getContext("2d");
ctx.font = "11px sans-serif"
const imageBase = new Image();
imageBase.onload = doIntro;
imageBase.src = (window.JSOTB && window.JSOTB.basePath) ?
	(window.JSOTB.basePath + "/img/iceblox.png") :
	"/JavaScriptOnTheBrain/img/iceblox.png";
console.log(`Loading base image from ${imageBase.src}`);

const STATE_INTRO = 0;
const STATE_GAME = 3;
const STATE_WIN_LEVEL = 4;
const STATE_DEAD = 5;

const FRAME_PENGUIN_HAPPY1 = 0;
const FRAME_PENGUIN_S1 = 1;
const FRAME_PENGUIN_S2 = 2;
const FRAME_PENGUIN_S3 = 3;
const FRAME_PENGUIN_N1 = 4;
const FRAME_PENGUIN_N2 = 5;
const FRAME_PENGUIN_N3 = 6;
const FRAME_PENGUIN_W1 = 7;
const FRAME_PENGUIN_W2 = 8;
const FRAME_PENGUIN_W3 = 9;
const FRAME_PENGUIN_E1 = 10;
const FRAME_PENGUIN_E2 = 11;
const FRAME_PENGUIN_E3 = 12;
const FRAME_PENGUIN_LIVES_ICON = 13;
const FRAME_ROCK = 14;
const FRAME_COIN = 15;
const FRAME_ICE1 = 16;
const FRAME_ICE2 = 17;
const FRAME_ICE3 = 18;
const FRAME_ICE4 = 19;
const FRAME_ICE5 = 20;
const FRAME_ICE6 = 21;
const FRAME_ICE7 = 22;
const FRAME_ICE8 = 23;
const FRAME_ICE_COIN1 = 24;
const FRAME_ICE_COIN2 = 25;
const FRAME_ICE_COIN3 = 26;
const FRAME_ICE_COIN4 = 27;
const FRAME_ICE_COIN5 = 28;
const FRAME_ICE_COIN6 = 29;
const FRAME_ICE_COIN7 = 30;
const FRAME_ICE_COIN8 = 31;
const FRAME_BADDIE1 = 32;
const FRAME_BADDIE2 = 33;
const FRAME_BADDIE3 = 34;
const FRAME_BADDIE4 = 35;
const FRAME_BADDIE5 = 36;
const FRAME_50_1 = 37;
const FRAME_50_2 = 38;
const FRAME_PENGUIN_HAPPY2 = 39;
const FRAME_PENGUIN_DEAD1 = 40;
const FRAME_PENGUIN_DEAD2 = 41;
const FRAME_PENGUIN_DEAD3 = 42;
const FRAME_PENGUIN_DEAD4 = 43;
const FRAME_PENGUIN_DEAD5 = 44;
const FRAME_PENGUIN_DEAD6 = 45;
const FRAME_PENGUIN_DEAD7 = 46;
const FRAME_PENGUIN_DEAD8 = 47;

const DIRECTION_NORTH = 0;
const DIRECTION_EAST = 1;
const DIRECTION_SOUTH = 2;
const DIRECTION_WEST = 3;

const ACTION_WAIT = 0;
const ACTION_MOVE_NORTH = 1;
const ACTION_MOVE_EAST = 2;
const ACTION_MOVE_SOUTH = 3;
const ACTION_MOVE_WEST = 4;

const FIELD_Y = 18;
const FIELD_HEIGHT = cnv.height - FIELD_Y;
const CELLS_X = Math.floor(cnv.width/30);
const CELLS_Y = Math.floor(FIELD_HEIGHT/30);

const maxLevelBuild = 6;
const levelCounts = new Array(maxLevelBuild).fill(null).map((_, i) => {
	return {
		flame: 2 + i % 3,
		rock: i + 5,
		ice: 35 - i * 2,
		speed: (i < 3)?3:5
	}
});
/** @type {LevelObject[]} */
const levelObjects = [];
const playArea = new Array((CELLS_X + 2) * (CELLS_Y + 3));


const keys = {
	space: false,
	up: false,
	down: false,
	left: false,
	right: false,
};

let currentState = STATE_INTRO;
let frameCounter = 0;
let fieldMask = cnv.width/2; // when levelMask > 0, the UI is drawn and the level "opens up", levelMask decrements each frame and is reset on level start
let deadFrame = -1; // if < 0, player is alive
let winFrame = -1; // if > 0, drawFrame(winFrame++, playerX, playerY);
let level = 1;
let score = 0;
let lives = 3;

class LevelObject {
	get cellX() {
		return Math.floor(this.x / 30);
	}
	get cellY() {
		return Math.floor(this.y / 30);
	}
	get onCell() {
		return this.x % 30 === 0 && this.y % 30 === 0
	}
	constructor(frame, x, y) {
		this.frame = frame;
		this.x = x;
		this.y = y; // pixel position below FIELD_Y
		this.isMoving = false;
		this.animOffset = randInt(1, 5);
		this.speed = 3;
		this.action = ACTION_WAIT;
	}
	update() {
		if(this.frame === FRAME_ROCK) return;
		if(this.isMoving) {
			if(this.onCell) {
				this.isMoving = false;
				this.action = ACTION_WAIT;
			}
		}
	}
	draw() {
		if(this.frame >= FRAME_BADDIE1 && this.frame <= FRAME_BADDIE5) {
			drawBaddie(this.x, FIELD_Y + this.y, this.animOffset);
		} else {
			drawFrame(this.frame, this.x, FIELD_Y + this.y);
		}
	}
}

class PlayerObject extends LevelObject {
	constructor(frame, x, y) {
		super(frame, x, y);
	}
	update() {
		super.update();
		if(this.onCell) {
			if(keys.up && this.y > 0 && playArea[this.cellX + CELLS_X * (this.cellY - 1)] === 255) {
				this.isMoving = true;
				this.y -= this.speed;
				this.frame = FRAME_PENGUIN_N1;
			} else if(keys.down && this.cellY < CELLS_Y-1 && playArea[this.cellX + CELLS_X * (this.cellY + 1)] === 255) {
				this.isMoving = true;
				this.y += this.speed;
				this.frame = FRAME_PENGUIN_S1;
			} else if(keys.left && this.x > 0 && playArea[(this.cellX - 1) + CELLS_X * this.cellY] === 255) {
				this.isMoving = true;
				this.x -= this.speed;
				this.frame = FRAME_PENGUIN_W1;
			} else if(keys.right && this.cellX < CELLS_X-1 && playArea[(this.cellX + 1) + CELLS_X * this.cellY] === 255) {
				this.isMoving = true;
				this.x += this.speed;
				this.frame = FRAME_PENGUIN_E1;
			} else {
				this.isMoving = false;
			}
		}
		if(this.isMoving) {
			if(this.frame >= FRAME_PENGUIN_N1 && this.frame <= FRAME_PENGUIN_N3) {
				this.y -= this.speed;
			} else if(this.frame >= FRAME_PENGUIN_S1 && this.frame <= FRAME_PENGUIN_S3) {
				this.y += this.speed;
			} if(this.frame >= FRAME_PENGUIN_W1 && this.frame <= FRAME_PENGUIN_W3) {
				this.x -= this.speed;
			} if(this.frame >= FRAME_PENGUIN_E1 && this.frame <= FRAME_PENGUIN_E3) {
				this.x += this.speed;
			}
		}
	}
	draw() {
		if(!this.onCell) {
			if(this.frame >= FRAME_PENGUIN_N1 && this.frame <= FRAME_PENGUIN_N3) {
				if(++this.frame > FRAME_PENGUIN_N3) this.frame = FRAME_PENGUIN_N1;
			} else if(this.frame >= FRAME_PENGUIN_S1 && this.frame <= FRAME_PENGUIN_S3) {
				if(++this.frame > FRAME_PENGUIN_S3) this.frame = FRAME_PENGUIN_S1;
			} if(this.frame >= FRAME_PENGUIN_W1 && this.frame <= FRAME_PENGUIN_W3) {
				if(++this.frame > FRAME_PENGUIN_W3) this.frame = FRAME_PENGUIN_W1;
			} if(this.frame >= FRAME_PENGUIN_E1 && this.frame <= FRAME_PENGUIN_E3) {
				if(++this.frame > FRAME_PENGUIN_E3) this.frame = FRAME_PENGUIN_E1;
			}
		}
		drawFrame(this.frame, this.x, this.y + FIELD_Y);
	}
}

function doIntro() {
	ctx.drawImage(imageBase, 0, 179,240, 65, (cnv.width-240)/2, 10, 240, 65);
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";
	
	if(frameCounter >= 210) {
		frameCounter = 0; // reset intro screen
	}
	if(frameCounter < 70) {
		ctx.fillText("ACTORS AND OBJECTS", (cnv.width - ctx.measureText("ACTORS AND OBJECTS").width)/2, 97);
		drawFrame(FRAME_PENGUIN_S2, 140, 110);
		ctx.fillText("Pixel Pete, the penguin", 180, 130);
		drawBaddie(120,150,0);
		drawBaddie(140,150,2);
		ctx.fillText("Evil flames",180, 170);
		drawFrame(FRAME_ICE1, 140, 190);
		ctx.fillText("Ice cube", 180, 210);
		drawFrame(FRAME_ROCK, 140, 230);
		ctx.fillText("Solid rock", 180, 250);
		drawFrame(FRAME_ICE_COIN1, 140, 270);
		ctx.fillText("Frozen gold coin", 180, 290);
	} else if(frameCounter < 140) {
		ctx.fillText("HOW TO PLAY", (cnv.width - ctx.measureText("HOW TO PLAY").width)/2, 97);
		drawFrame(frameCounter % FRAME_PENGUIN_LIVES_ICON, 140, 110);
		ctx.fillText("Move up, down, left and right", 180, 122);
		ctx.fillText("with the arrow keys or WASD", 180, 137);

		drawFrame(FRAME_PENGUIN_E1, 70, 150);
		drawFrame(FRAME_ICE1,140, 150);
		ctx.beginPath();
		ctx.moveTo(110, 160);
		ctx.lineTo(136, 160);
		ctx.moveTo(116, 169);
		ctx.lineTo(136, 169);
		ctx.stroke();
		ctx.fillText("Walk against ice cubes", 180, 162);
		ctx.fillText("to move them out of the way", 180, 177);

		drawFrame(FRAME_PENGUIN_E1, 80, 190);
		drawFrame(FRAME_ICE3, 110, 190);
		drawFrame(FRAME_ICE1, 140, 190);
		ctx.fillText("Walk against blocked", 180, 202);
		ctx.fillText("ice cubes to crack them", 180, 217);

		drawFrame(FRAME_ICE_COIN3, 110, 230);
		drawFrame(FRAME_PENGUIN_W1, 140, 230);
		ctx.fillText("Free the gold coins by", 180, 242);
		ctx.fillText("crushing the ice around them", 180, 257);

		drawFrame(FRAME_PENGUIN_W3, 80, 270);
		drawBaddie(140, 270);
		ctx.beginPath();
		ctx.moveTo(110, 280);
		ctx.lineTo(126, 280);
		ctx.moveTo(110, 289);
		ctx.lineTo(130, 289);
		ctx.stroke();
		ctx.fillText("And watch out", 180, 282);
		ctx.fillText("for the flames", 180, 297)
	} else if(frameCounter < 210) {
		ctx.fillText("SCORING", (cnv.width - ctx.measureText("SCORING").width)/2, 97);
		drawFrame(FRAME_PENGUIN_E1, 110, 110);
		drawFrame(FRAME_ICE3, 140, 110);
		ctx.fillText("Breaking ice,",180, 122);
		ctx.fillText("5 points",180, 137);

		drawBaddie(60, 150)
		drawFrame(FRAME_ICE1, 80, 150);
		drawFrame(FRAME_PENGUIN_W3, 140, 150);
		ctx.beginPath();
		ctx.moveTo(112, 160);
		ctx.lineTo(126, 160);
		ctx.moveTo(112, 169);
		ctx.lineTo(130, 169);
		ctx.stroke();
		ctx.fillText("Putting out flame", 180, 162);
		ctx.fillText("with ice, 50 points", 180, 177);

		drawFrame(FRAME_PENGUIN_E1, 110, 190);
		drawFrame(FRAME_ICE_COIN4, 140, 190);
		ctx.fillText("Freeing coin,", 180, 202);
		ctx.fillText("100 points", 180, 217);

		for(let j = 0; j < 5; j++)
			drawFrame(15,100-9*j, 230);
		drawFrame(FRAME_PENGUIN_HAPPY2, 140, 230);
		ctx.fillText("Taking all coins and advancing", 180, 242);
		ctx.fillText("to next level, 1000 points", 180, 257);
	}
	ctx.fillText("Press SPACE to start", (cnv.width - ctx.measureText("Press SPACE to start").width)/2, 330);
	if(keys.space) {
		currentState = STATE_GAME;
		buildField();
	}
}

function buildField() {
	playArea.fill(255);
	const levelI = ((level >= maxLevelBuild)?maxLevelBuild:level) - 1;
	const stack = new Array(CELLS_X * CELLS_Y).fill(0);
	while(levelObjects.length > 0)
		levelObjects.pop();
	levelObjects.push(new PlayerObject(FRAME_PENGUIN_S2, 0, 0));

	let rocks = levelCounts[levelI].rock;
	let ice = levelCounts[levelI].ice;
	let notDone = true;
	let p = 0, q = 1;
	while(notDone) {
		for(let y = 1; y <= CELLS_Y; y++) {
			for(let x = 1; x <= CELLS_X; x++) {
				playArea[y * (CELLS_X + 2) + x] = 0;
			}
		}
		playArea[CELLS_X + 3]= -1;
		notDone = false;
		let i = 0;
		let j = 5 + ice + rocks;
		while(i < j) {
			p = 1 + Math.floor(Math.random() * CELLS_X);
			q = 1 + Math.floor(Math.random() * CELLS_Y);
			if(playArea[q * (CELLS_X + 2) + p] === 0) {
				let item = 0;
				if(i < 5) item = 10; // frozen coin
				else if(i < ice + 5) item = 2; // ice cube
				else item = 1; // rock
				playArea[q * (CELLS_X + 2) + p] = item;
				i++;
			}
		}
		playArea[CELLS_X+3]=0; // Clear start square
		p = 0;
		q = 1;
		i = 0;
		stack[0] = CELLS_X + 3;
		while(p < q) {
			const j = stack[p++];
			if((playArea[j - CELLS_X - 2] & 17) == 0) {
				stack[q] = j - CELLS_X - 2;
				if(playArea[stack[q]] == 10) i++;
				playArea[stack[q++]] |= 16;
			}
			if((playArea[j + CELLS_X + 2] & 17) == 0) {
				stack[q]=j + CELLS_X + 2;
				if(playArea[stack[q]] == 10) i++;
				playArea[stack[q++]]|=16;
			}
			if((playArea[j - 1] & 17) == 0) {
				stack[q] = j - 1;
				if(playArea[stack[q]] == 10) i++;
				playArea[stack[q++]] |= 16;
			}
			if((playArea[j+1] & 17) == 0) {
				stack[q] = j + 1;
				if(playArea[stack[q]] == 10) i++;
				playArea[stack[q++]] |= 16;
			}
		}
		notDone = i < 5;
	}
}

function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawBaddie(x, y, animOffset = 0) {
	// animOffset should be set either manually or when the baddies are first created, not set each frame
	const frameMod = (frameCounter + animOffset) % 10;
	const flameFrame = ((frameMod < 5)?frameMod:9-frameMod) + FRAME_BADDIE1; // 0,1,2,3,4,5,4,3,2,1,...
	drawFrame(flameFrame, x, y);
}

function drawFrame(frame, x, y) {
	const frameX = (frame % 8) * 30;
	const frameY = Math.floor(frame / 8) * 30;
	ctx.drawImage(imageBase, frameX, frameY, 30, 30, x, y, 30, 30);
}

function drawUI() {
	ctx.fillStyle = "white";
	ctx.fillText(`SCORE: ${score}`, 4, 12);
	ctx.fillText(`LEVEL: ${level}`, 125, 12);
	ctx.fillText("SPARE LIVES:", 220, 12);
	for(let i = 0; i < lives; i++) {
		drawFrame(FRAME_PENGUIN_LIVES_ICON, 290 + i * 15, -16)
	}

	ctx.fillStyle = ctx.createLinearGradient(0, FIELD_Y-4, 0, FIELD_Y)
	ctx.fillStyle.addColorStop(0, "white");
	ctx.fillStyle.addColorStop(1, "black");
	ctx.fillRect(0, FIELD_Y - 4, cnv.width, 4);

	if(fieldMask > 0) {
		fieldMask -= 6;
		ctx.fillStyle = "black";
		ctx.fillRect(0, FIELD_Y, fieldMask, FIELD_HEIGHT); // left mask
		ctx.fillRect(cnv.width - fieldMask, FIELD_Y, cnv.width - fieldMask, FIELD_HEIGHT); // right mask
		ctx.fillRect(0, cnv.height - fieldMask, cnv.width, FIELD_Y + fieldMask);
		ctx.fillRect(0, FIELD_Y, cnv.width, fieldMask); // top mask
		if(fieldMask < 0) fieldMask = 0;
	}
}

function drawField() {
	for(let y = 0; y < CELLS_Y; y++) {
		for(let x = 0; x < CELLS_X; x++) {
			const p = (y + 1) * (CELLS_X + 2) + x + 1;
			playArea[p] &= 15;
			let frame = -1;
			switch(playArea[p]) {
				case 1:
					frame = FRAME_ROCK;
					break;
				case 2:
					frame = FRAME_ICE1;
					break;
				case 10:
					frame = FRAME_ICE_COIN1;
					break;
			}
			if(frame > 0) {
				drawFrame(frame, x * 30, FIELD_Y + y * 30);
			}
		}
	}
}

function updateKeyState(key, down) {
	switch(key.toLowerCase()) {
		case "arrowup":
		case "w":
		case "k":
			keys.up = down;
			break;
		case "arrowdown":
		case "s":
		case "m":
			keys.down = down;
			break;
		case "arrowright":
		case "d":
			keys.right = down;
			break;
		case "arrowleft":
		case "a":
			keys.left = down;
			break;
		case " ":
			keys.space = down;
			break;
		default:
			return false;
	}
	return true;
}

window.addEventListener("keydown", (ev) => {
	if(updateKeyState(ev.key, true)) {
		ev.preventDefault();
	}
});

/** @param {KeyboardEvent|FocusEvent} ev  */
function onKeyUp(ev) {
	if(ev.type === "focusout") {
		// reset all key states when the user clicks on something else
		keys.up = false;
		keys.down = false;
		keys.left = false;
		keys.right = false;
		keys.space = false;
		return;
	}
	if(updateKeyState(ev.key, false)) {
		ev.preventDefault();
	}
}

window.addEventListener("keyup", onkeyup);
cnv.addEventListener("focusout", onKeyUp);

function gameLoop() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, cnv.width, cnv.height);

	switch(currentState) {
		case STATE_INTRO:
			doIntro();
			break;
		case STATE_GAME:
			drawField();
			for(const obj of levelObjects) {
				if(obj) {
					obj.update();
					obj.draw();
				}
			}
			drawUI();
			break;
		case STATE_DEAD:
		case STATE_WIN_LEVEL:
			drawField();
			levelObjects[0].draw();
			drawUI();
			break;
	}
	frameCounter++;
}

setInterval(gameLoop, 100);
gameLoop();
