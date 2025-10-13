import {
	BoxGeometry, LinearFilter, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Raycaster, Scene,
	TextureLoader, Vector3, WebGLRenderer
} from "three";

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

const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);
const AXIS_Z = new Vector3(0, 0, 1);
const origin = new Vector3(0, 0, 0);

const texLoader = new TextureLoader();
const texture = texLoader.load(window.JSOTB.basePath + "/img/rubiktex.png");
texture.minFilter = LinearFilter;

const scene = new Scene();
const camera = new PerspectiveCamera(80, cnv.width / cnv.height, 0.1, 1000);

const MATERIAL_BLACK = new MeshBasicMaterial({color: "#000000"});
const MATERIAL_GREEN = new MeshBasicMaterial({color: "#72ff72", map: texture});
const MATERIAL_ORANGE = new MeshBasicMaterial({color: "#ffcf39", map: texture});
const MATERIAL_RED = new MeshBasicMaterial({color: "#ff5f5f", map: texture});
const MATERIAL_YELLOW = new MeshBasicMaterial({color: "#ffff72", map: texture});
const MATERIAL_BLUE = new MeshBasicMaterial({color: "#7272ff", map: texture});
const MATERIAL_WHITE = new MeshBasicMaterial({color: "#ffffff", map: texture});

const FACE_RIGHT = 0;
const FACE_LEFT = 1;
const FACE_TOP = 2;
const FACE_BOTTOM = 3;
const FACE_FRONT = 4;
const FACE_BACK = 5;

function rotateAboutPoint(obj, point, axis, theta, pointIsWorld = true) {
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


function generateCubeMaterials(x, y, z) {
	const materials = [
		MATERIAL_GREEN,
		MATERIAL_ORANGE,
		MATERIAL_RED,
		MATERIAL_YELLOW,
		MATERIAL_BLUE,
		MATERIAL_WHITE
	];
	if(x === 1) {
		materials[FACE_LEFT] = MATERIAL_BLACK;
	} else {
		materials[FACE_RIGHT] = MATERIAL_BLACK;
	}
	if(y === 1) {
		materials[FACE_BOTTOM] = MATERIAL_BLACK;
	} else {
		materials[FACE_TOP] = MATERIAL_BLACK;
	}
	if(z === 1) {
		materials[FACE_BACK] = MATERIAL_BLACK;
	} else {
		materials[FACE_FRONT] = MATERIAL_BLACK;
	}
	return materials;
}

function addCube(x, y, z) {
	const geometry = new BoxGeometry(1, 1, 1);
	const materials = generateCubeMaterials(x, y, z);
	const cube = new Mesh(geometry, materials);
	// materials.
	// if(y === 0) {
	// 	cube.material[FACE_TOP] = material_black;
	// }
	cube.position.set(x, y, z);
	scene.add(cube);
	return cube;
}

class PickHelper {
	constructor() {
		this.raycaster = new Raycaster();
		this.pickedObject = null;
		this.pickedObjectSavedColor = 0;
	}
	pick( normalizedPosition, scene, camera, time ) {
		// restore the color if there is a picked object
		if(this.pickedObject ) {
			// this.pickedObject.material.emissive.setHex( this.pickedObjectSavedColor );
			this.pickedObject = undefined;
		}

		// cast a ray through the frustum
		this.raycaster.setFromCamera( normalizedPosition, camera );
		// get the list of objects the ray intersected
		const intersectedObjects = this.raycaster.intersectObjects( scene.children );
		if( intersectedObjects.length ) {
			// pick the first object. It's the closest one
			this.pickedObject = intersectedObjects[ 0 ].object;
			// save its color
			// this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
			// set its emissive color to flashing red/yellow
			// this.pickedObject.material.emissive.setHex( ( time * 8 ) % 2 > 1 ? 0xFFFF00 : 0xFF0000 );
		}
	}
}

const pickPosition = { x: 0, y: 0 };
const pickHelper = new PickHelper();

function getCanvasRelativePosition( event ) {
	const rect = cnv.getBoundingClientRect();
	return {
		x: ( event.clientX - rect.left ) * cnv.width / rect.width,
		y: ( event.clientY - rect.top ) * cnv.height / rect.height,
	};
}

function setPickPosition( event ) {
	const pos = getCanvasRelativePosition( event );
	pickPosition.x = ( pos.x / cnv.width ) * 2 - 1;
	pickPosition.y = ( pos.y / cnv.height ) * - 2 + 1; // note we flip Y
}

function clearPickPosition() {
	// unlike the mouse which always has a position if the user stops touching the screen we want
	// to stop picking. For now we just pick a value unlikely to pick something
	pickPosition.x = - 100000;
	pickPosition.y = - 100000;
	cubes.map(c => c.material.opacity = 1);
}

const cubes = [];

function rotateWholeCube(axis, angle) {
	rotateMatchingCubes(null, axis, angle);
}

const yTopMatcher = () => scene.getObjectsByProperty("yPos", 1);
const yMiddleMatcher = () => scene.getObjectsByProperty("yPos", 0);
const yBottomMatcher = () => scene.getObjectsByProperty("yPos", -1);
const xLeftMatcher = () => scene.getObjectsByProperty("xPos", -1);
const xMiddleMatcher = () => scene.getObjectsByProperty("xPos", 0);
const xRightMatcher = () => scene.getObjectsByProperty("xPos", 1);
const zFrontMatcher = () => scene.getObjectsByProperty("zPos", 1);
const zMiddleMatcher = () => scene.getObjectsByProperty("zPos", 0);
const zBackMatcher = () => scene.getObjectsByProperty("zPos", -1);
function rotateMatchingCubes(matcher, axis, angle) {
	let matched = matcher?matcher():cubes;
	if(!matched || matched.length === 0) {
		throw new Error("No cubes matched for rotation");
	}
	if(matched.length < 8) {
		throw new Error(`Invalid number of cubes matched for rotation (expected at least 8, got ${matched.length})`);
	}
	for(const c in matched) {
		rotateAboutPoint(matched[c], origin, axis, angle, true);
	}
}

const objRotateAll = new Object3D();
const objFront = new Object3D();
const objBack = new Object3D();
const objTop = new Object3D();
const objBottom = new Object3D();
const objLeft = new Object3D();
const objRight = new Object3D();

window.onload = function() {
	scene.add(objRotateAll);
	objRotateAll.add(objFront);
	objRotateAll.add(objBack);
	objRotateAll.add(objTop);
	objRotateAll.add(objBottom);
	objRotateAll.add(objLeft);
	objRotateAll.add(objRight);

	camera.position.z = 4;
	const renderer = new WebGLRenderer({canvas: cnv, alpha: true});
	renderer.setSize(cnv.width, cnv.height);

	for(let z = -1; z <= 1; z++) {
		for(let y = -1; y <= 1; y++) {
			for(let x = -1; x <= 1; x++) {
				if(x !== 0 || y !== 0 || z !== 0) {
					let cube = addCube(x, y, z);
					cube.xPos = x; // used for grouping cubes
					cube.yPos = y;
					cube.zPos = z;
					cube.parent = objRotateAll;
					cubes.push(cube);
				}
			}
		}
	}
	renderer.setAnimationLoop((time) => {
		pickHelper.pick( pickPosition, scene, camera, time );
		renderer.render(scene, camera);
	});
}


const keyState = { r: false, s: false };

window.addEventListener("keydown", function(event) {
	switch(event.key) {
		case "r":
		case "R":
			if (!keyState.r) {
				keyState.r = true;
				console.log("Resetting cube rotation");
				for (let c in cubes) {
					cubes[c].position.set(cubes[c].xPos, cubes[c].yPos, cubes[c].zPos);
					cubes[c].rotation.set(0, 0, 0);
				}
			}
			break;
		case "s":
		case "S":
			if(!keyState.s) {
				console.log("Spinning cube");
				let vector = new Vector3(1, 0, 0);
				vector.normalize();
				keyState.s = true;
				rotateMatchingCubes(yMiddleMatcher, vector, Math.PI / 2);
				for(const cube of cubes) {
					
				}
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

const mouseState = {
	left: false, // used for rotating single row/column
	middleRight: false, // used for rotating entire cube
	x: -1,
	y: -1,
	lastX: -1,
	lastY: -1,
	dx: 0,
	dy: 0
};
cnv.addEventListener("mousedown", function(e) {
	if(e.button === 0) {
		mouseState.left = true;
		setPickPosition(e);
		if(pickHelper.pickedObject) {
			scene.remove(pickHelper.pickedObject);
			// console.log(pickHelper.pickedObject)
			// console.log(pickHelper.pickedObject.position);
			// console.log(pickHelper.pickedObject.rotation);
		}
	} else if(e.button === 1 || e.button === 2) {
		mouseState.middleRight = true;
	}
});

window.addEventListener("mousemove", function(e) {
	mouseState.lastX = mouseState.x;
	mouseState.lastY = mouseState.y;
	mouseState.x = e.x;
	mouseState.y = e.y;
	mouseState.dx = mouseState.x - mouseState.lastX;
	mouseState.dy = mouseState.y - mouseState.lastY;
	// console.log(`dx: ${mouseState.dx}, dy: ${mouseState.dy}`);

	if(mouseState.middleRight && mouseState.lastX >= 0 && mouseState.lastY >= 0) {
		const axis = new Vector3(mouseState.dy, mouseState.dx, 0);
		axis.normalize();
		objRotateAll.rotation.x += mouseState.dy * 0.01;
		objRotateAll.rotation.y += mouseState.dx * 0.01;
	}
	setPickPosition(e);
});


["mouseleave", "mouseout", "mouseup"].map(eType => {
	window.addEventListener(eType, e => {
		if(e.type === "mouseup") {
			clearPickPosition();
		}
		if(e.button === 0) {
			mouseState.left = false;
		} else if(e.button === 1 || e.button === 2) {
			mouseState.middleRight = false;
		}
	});
});

cnv.addEventListener("contextmenu", e => e.preventDefault());