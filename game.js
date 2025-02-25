// Escena y configuración básica de Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luces
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Textura de mármol para el tablero
const textureLoader = new THREE.TextureLoader();
const marbleTexture = textureLoader.load('https://raw.githubusercontent.com/laurwz/nefertiti/main/marble-texture.jpg');
const boardGeometry = new THREE.PlaneGeometry(8, 8);
const boardMaterial = new THREE.MeshPhongMaterial({
    map: marbleTexture,
    specular: 0xeeeeee,
    shininess: 100,
    side: THREE.DoubleSide
});
const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.rotation.x = -Math.PI / 2;
scene.add(board);

// Casillas del tablero
const squareGeometry = new THREE.PlaneGeometry(1, 1);
const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
let squares = [];
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const material = (i + j) % 2 === 0 ? whiteMaterial : blackMaterial;
        const square = new THREE.Mesh(squareGeometry, material);
        square.position.set(i - 3.5, j - 3.5, 0.01);
        board.add(square);
        squares.push(square);
    }
}

// Lógica de ajedrez con chess.js
const game = new Chess();

// Piezas placeholder (cubos simples)
const pieceGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const pieceMaterials = {
    'w': new THREE.MeshPhongMaterial({ color: 0xffffff }), // Blancas
    'b': new THREE.MeshPhongMaterial({ color: 0x000000 })  // Negras
};
const pieces = {};

function updatePieces() {
    // Limpiar piezas anteriores
    Object.values(pieces).forEach(piece => board.remove(piece));
    const fen = game.fen().split(' ')[0];
    const rows = fen.split('/');
    for (let y = 0; y < 8; y++) {
        let x = 0;
        for (let char of rows[y]) {
            if (/\d/.test(char)) {
                x += parseInt(char);
            } else {
                const color = char === char.toUpperCase() ? 'w' : 'b';
                const piece = new THREE.Mesh(pieceGeometry, pieceMaterials[color]);
                piece.position.set(x - 3.5, 7 - y - 3.5, 0.25);
                board.add(piece);
                pieces[`${x},${y}`] = piece;
                x++;
            }
        }
    }
}
updatePieces();

// Configuración de la cámara
camera.position.z = 10;

// Interacción con el tablero
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationX = -Math.PI / 2;
let rotationY = 0;
let zoomFactor = 1;

document.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});
document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        rotationY += deltaX * 0.01;
        rotationX -= deltaY * 0.01;
        rotationX = Math.max(-Math.PI / 2, Math.min(rotationX, Math.PI / 4));
        board.rotation.x = rotationX;
        board.rotation.y = rotationY;
    }
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

document.addEventListener('wheel', (e) => {
    zoomFactor += e.deltaY > 0 ? 0.1 : -0.1;
    zoomFactor = Math.max(1, Math.min(zoomFactor, 5));
    camera.position.z = zoomFactor * 10;
    e.preventDefault();
});

let initialTouchDistance = 0;
document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialTouchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }
});
document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const zoomChange = currentDistance - initialTouchDistance;
        if (Math.abs(zoomChange) > 10) {
            zoomFactor += zoomChange * 0.01;
            zoomFactor = Math.max(1, Math.min(zoomFactor, 5));
            camera.position.z = zoomFactor * 10;
            initialTouchDistance = currentDistance;
        }
    }
});

// Redimensionamiento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Raycaster para interacción con casillas
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedPiece = null;

document.addEventListener('mousedown', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(squares);
    if (intersects.length > 0) {
        const square = intersects[0].object;
        const x = Math.floor(square.position.x + 3.5);
        const y = Math.floor(square.position.y + 3.5);
        const pos = `${String.fromCharCode(97 + x)}${8 - y}`;
        if (selectedPiece) {
            const move = game.move({ from: selectedPiece, to: pos });
            if (move) {
                updatePieces();
            }
            selectedPiece = null;
        } else if (game.get(pos)) {
            selectedPiece = pos;
        }
    }
});

// Animación
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();