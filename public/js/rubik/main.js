import {
	BoxGeometry, Group, LinearFilter, Matrix4, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Raycaster, Scene,
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

function addCube(x, y, z) {
	const geometry = new BoxGeometry(1, 1, 1);
	const materials = [
		(x < 1)?MATERIAL_BLACK:MATERIAL_GREEN,
		(x > -1)?MATERIAL_BLACK:MATERIAL_ORANGE,
		(y < 1)?MATERIAL_BLACK:MATERIAL_RED,
		(y > -1)?MATERIAL_BLACK:MATERIAL_YELLOW,
		(z < 1)?MATERIAL_BLACK:MATERIAL_BLUE,
		(z > -1)?MATERIAL_BLACK:MATERIAL_WHITE
	];
	const cube = new Mesh(geometry, materials);
	cube.position.set(x, y, z);
	scene.add(cube);
	return cube;
}

const rayCaster = new Raycaster();
let pickedObject = null;
const pickPosition = { x: 0, y: 0 };

function pickObject(normalizedPosition) {
	// cast a ray through the frustum
	rayCaster.setFromCamera(normalizedPosition, camera);

	const intersectedObjects = rayCaster.intersectObjects(scene.children);
	if(intersectedObjects.length) {
		// pick the closest object
		pickedObject = intersectedObjects[0].object;
	}
}

function getCanvasRelativePosition( event ) {
	const rect = cnv.getBoundingClientRect();
	return {
		x: ( event.clientX - rect.left ) * cnv.width / rect.width,
		y: ( event.clientY - rect.top ) * cnv.height / rect.height,
	};
}

function setPickPosition(event) {
	const pos = getCanvasRelativePosition(event);
	pickPosition.x = (pos.x / cnv.width) * 2 - 1;
	pickPosition.y = (pos.y / cnv.height) * -2 + 1; // note we flip Y
}

function clearPickPosition() {
	// unlike the mouse which always has a position if the user stops touching the screen we want
	// to stop picking. For now we just pick a value unlikely to pick something
	pickPosition.x = - 100000;
	pickPosition.y = - 100000;
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

function preserveWorldTransform(object, newParent) {
	// Save world transform
	object.updateMatrixWorld(true);
	const worldMatrix = object.matrixWorld.clone();

	// Reparent
	newParent.add(object);

	// Apply old world transform relative to new parent
	newParent.updateMatrixWorld(true);
	const parentInverse = new Matrix4().copy(newParent.matrixWorld).invert();
	object.matrix.copy(parentInverse.multiply(worldMatrix));
	object.matrix.decompose(object.position, object.quaternion, object.scale);
}

const objRotateAll = new Group();
const objFront = new Group();
const objBack = new Group();
const objTop = new Group();
const objBottom = new Group();
const objLeft = new Group();
const objRight = new Group();

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
	renderer.setAnimationLoop(() => {
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
	dy: 0,
	matcher: null // function to match cubes for rotation
};
cnv.addEventListener("mousedown", function(e) {
	if(e.button === 0) {
		mouseState.left = true;
		setPickPosition(e);
		pickObject(pickPosition);
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
	if(mouseState.middleRight && mouseState.lastX >= 0 && mouseState.lastY >= 0) {
		const axis = new Vector3(mouseState.dy, mouseState.dx, 0);
		axis.normalize();
		objRotateAll.rotation.x += mouseState.dy * 0.01;
		objRotateAll.rotation.y += mouseState.dx * 0.01;
	} else if(mouseState.left && pickedObject) {
		const pos = pickedObject.position;
		if(mouseState.dx != 0) {
			 if(pos.x === -1) {
				mouseState.matcher = xLeftMatcher;
				const matched = xLeftMatcher();
				matched.map(m => preserveWorldTransform(m, objLeft));
				objLeft.rotation.x += mouseState.dy * 0.01;
			} else if(pos.x === 1) {
				mouseState.matcher = xRightMatcher;
				const matched = xRightMatcher();
				matched.map(m => preserveWorldTransform(m, objRight));
				objRight.rotation.x += mouseState.dy * 0.01;
			} else if(pos.y === 1) {
				mouseState.matcher = yTopMatcher;
				const matched = yTopMatcher();
				matched.map(m => preserveWorldTransform(m, objTop));
				objTop.rotation.y += mouseState.dx * 0.01;
			} else if(pos.y === -1) {
				mouseState.matcher = yBottomMatcher;
				const matched = yBottomMatcher();
				matched.map(m => preserveWorldTransform(m, objBottom));
				objBottom.rotation.y += mouseState.dx * 0.01;
			}
		}
	}
	// setPickPosition(e);
});

["mouseleave", "mouseout", "mouseup"].map(eType => {
	window.addEventListener(eType, e => {
		if(e.type === "mouseup") {
			clearPickPosition();
			mouseState.matcher = null;
			if(e.button === 0) {
				mouseState.left = false;
			} else if(e.button === 1 || e.button === 2) {
				mouseState.middleRight = false;
			}
		}
	});
});

cnv.addEventListener("contextmenu", e => e.preventDefault());