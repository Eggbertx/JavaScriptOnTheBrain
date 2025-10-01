import * as THREE from "three";

const gameplayArea = document.querySelector("section.game-info p:first-child");
if(!gameplayArea) {
	throw new Error("Gameplay area not found");
}

gameplayArea.insertAdjacentHTML("afterbegin",
	`<canvas id="rubik-canvas" class="main-canvas" width="120" height="120" style="float:left; padding:0.5em 1em;"/>`);

/** @type {HTMLCanvasElement} */
const cnv = document.querySelector("canvas#rubik-canvas");
if(!cnv) {
	throw new Error("Canvas element not found");
}

const COLOR_WHITE = "#ffffff";
const COLOR_BLUE = "#7272ff";
const COLOR_RED = "#ff5f5f";
const COLOR_GREEN = "#72ff72";
const COLOR_YELLOW = "#ffff72";
const COLOR_ORANGE = "#ffcf39";
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

const texLoader = new THREE.TextureLoader();
const texture = texLoader.load(window.JSOTB.basePath + "/img/rubiktex.png");
texture.minFilter = THREE.LinearFilter;

const materials = [
	new THREE.MeshBasicMaterial({color: COLOR_WHITE, map: texture}), // Front face
	new THREE.MeshBasicMaterial({color: COLOR_BLUE, map: texture}), // Back face
	new THREE.MeshBasicMaterial({color: COLOR_RED, map: texture}), // Top face
	new THREE.MeshBasicMaterial({color: COLOR_GREEN, map: texture}), // Bottom face
	new THREE.MeshBasicMaterial({color: COLOR_YELLOW, map: texture}), // Right face
	new THREE.MeshBasicMaterial({color: COLOR_ORANGE, map: texture}), // Left face
];

function rotateAboutPoint(obj, point, axis, theta, pointIsWorld) {
	pointIsWorld = (pointIsWorld === undefined) ? false : pointIsWorld;
	if(pointIsWorld) {
		obj.parent.localToWorld(obj.position);
	}
	obj.position.sub(point); // use origin as pivot point
	obj.position.applyAxisAngle(axis, theta);
	obj.position.add(point); // return to original position
	if(pointIsWorld) {
		obj.parent.worldToLocal(obj.position);
	}
	obj.rotateOnAxis(axis, theta);
}

function addCube(scene, x, y, z) {
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const cube = new THREE.Mesh(geometry, materials);
	cube.position.set(x, y, z);
	scene.add(cube);
	return cube;
}

const cubes = [];
let cube
window.onload = function() {
	console.log("Initializing WebGL context");
	const scene = new THREE.Scene();
	// scene.background = new THREE.Color("#c0c0c0");

	const camera = new THREE.PerspectiveCamera(80, cnv.width / cnv.height, 0.1, 1000);
	camera.position.z = 4;
	const renderer = new THREE.WebGLRenderer({canvas: cnv, alpha: true});
	renderer.setSize(cnv.width, cnv.height);

	for(let z = -1; z <= 1; z++) {
		for(let y = -1; y <= 1; y++) {
			for(let x = -1; x <= 1; x++) {
				if(x !== 0 || y !== 0 || z !== 0) {
					cubes.push(addCube(scene, x, y, z));
				}
			}
		}
	}
	renderer.setAnimationLoop(() => {
		for(const c in cubes) {
			rotateAboutPoint(cubes[c], new THREE.Vector3(0, 0, 0), new THREE.Vector3(1,0,0), 0.02, true);
		}
		renderer.render(scene, camera);
	});
}

const keyState = { r: false, s: false };

window.addEventListener("keydown", function(event) {
	switch(event.key) {
		case "r":
		case "R":
			if (!keyState.r && cube) {
				keyState.r = true;
				cube.rotation.x = 0;
				cube.rotation.y = 0;
			}
			break;
		case "s":
		case "S":
			if(!keyState.s && cube) {
				keyState.s = true;
				cube.rotation.x = Math.random() * Math.PI * 2;
				cube.rotation.y = Math.random() * Math.PI * 2;
			}
			break;
	}
});

window.addEventListener("keyup", function(event) {
	switch(event.key) {
		case "r":
		case "R":
			keyState.r = false;
			break;
		case "s":
		case "S":
			keyState.s = false;
			break;
	}
});