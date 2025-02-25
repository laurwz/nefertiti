const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Fondo transparente
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040, 2); // Aumentar intensidad
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Aumentar intensidad
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();
const marbleTexture = textureLoader.load('marble.jpg', 
    () => console.log("Textura de mármol cargada correctamente"),
    undefined,
    (err) => console.error("Error al cargar la textura de mármol:", err)
);
marbleTexture.wrapS = THREE.RepeatWrapping;
marbleTexture.wrapT = THREE.RepeatWrapping;
marbleTexture.repeat.set(2, 2); // Repetir la textura para mejor visibilidad
const boardGeometry = new THREE.BoxGeometry(8, 8, 1); // Aumentar grosor a 1 para notar la extrusión
const boardMaterial = new THREE.MeshPhongMaterial({ 
    map: marbleTexture, 
    specular: 0xeeeeee, 
    shininess: 100 
});
const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.position.z = 0.5; // Ajustar posición por el grosor
scene.add(board);

const squareGeometry = new THREE.PlaneGeometry(1, 1);
const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
let squares = [];
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const material = (i + j) % 2 === 0 ? whiteMaterial : blackMaterial;
        const square = new THREE.Mesh(squareGeometry, material);
        square.position.set(i - 3.5, j - 3.5, 0.51); // Ajustar a la nueva altura del tablero
        board.add(square);
        squares.push(square);
    }
}

const game = new Chess();
const pieceGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const pieceMaterials = {
    'w': new THREE.MeshPhongMaterial({ color: 0xffffff }),
    'b': new THREE.MeshPhongMaterial({ color: 0x000000 })
};
const pieces = {};

function updatePieces() {
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
                piece.position.set(x - 3.5, 7 - y - 3.5, 0.75); // Ajustar altura
                board.add(piece);
                pieces[`${x},${y}`] = piece;
                x++;
            }
        }
    }
}
updatePieces();

camera.position.z = 10;

let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationX = -Math.PI / 2; // Inicialmente plano
let rotationY = 0;

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
        rotationX += deltaX * 0.01; // Rotación completa en X
        rotationY -= deltaY * 0.01; // Limitar en Y
        rotationY = Math.max(-Math.PI / 9, Math.min(rotationY, Math.PI / 9)); // ±20° (aprox Math.PI / 9)
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedPiece = null;

document.addEventListener('mousedown', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const pieceIntersects = raycaster.intersectObjects(Object.values(pieces));
    const squareIntersects = raycaster.intersectObjects(squares);

    if (pieceIntersects.length > 0) {
        const piece = pieceIntersects[0].object;
        const piecePos = Object.keys(pieces).find(key => pieces[key] === piece);
        const [x, y] = piecePos.split(',').map(Number);
        selectedPiece = `${String.fromCharCode(97 + x)}${8 - y}`;
        piece.position.z = 1; // Resaltar subiendo más
    } else if (squareIntersects.length > 0 && selectedPiece) {
        const square = squareIntersects[0].object;
        const x = Math.floor(square.position.x + 3.5);
        const y = Math.floor(square.position.y + 3.5);
        const pos = `${String.fromCharCode(97 + x)}${8 - y}`;
        const move = game.move({ from: selectedPiece, to: pos });
        if (move) {
            updatePieces();
        } else {
            const [oldX, oldY] = [selectedPiece.charCodeAt(0) - 97, 8 - parseInt(selectedPiece[1])];
            pieces[`${oldX},${oldY}`].position.z = 0.75;
        }
        selectedPiece = null;
    }
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();