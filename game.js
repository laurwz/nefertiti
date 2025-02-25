const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Fondo transparente
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040, 2); // Iluminación aumentada
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Iluminación aumentada
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Usar una URL pública para marble.jpg
const textureLoader = new THREE.TextureLoader();
const marbleTexture = textureLoader.load('https://raw.githubusercontent.com/laurwz/nefertiti/main/marble.jpg', 
    () => console.log("Textura de mármol cargada correctamente"),
    undefined,
    (err) => console.error("Error al cargar la textura de mármol:", err)
);
marbleTexture.wrapS = THREE.RepeatWrapping;
marbleTexture.wrapT = THREE.RepeatWrapping;
marbleTexture.repeat.set(4, 4); // Aumentar repetición para mejor visibilidad
const boardGeometry = new THREE.BoxGeometry(8, 8, 2); // Grosor evidente
const boardMaterial = new THREE.MeshPhongMaterial({ 
    map: marbleTexture, 
    specular: 0xeeeeee, 
    shininess: 100 
});
const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.position.z = 1; // Ajustar posición por el grosor
board.rotation.set(0, 0, 0); // Fijar rotación del tablero a 0 (plano)
scene.add(board);

const squareGeometry = new THREE.PlaneGeometry(1, 1);
const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
let squares = [];
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const material = (i + j) % 2 === 0 ? whiteMaterial : blackMaterial;
        const square = new THREE.Mesh(squareGeometry, material);
        square.position.set(i - 3.5, j - 3.5, 1.01); // Ajustar a la nueva altura
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
                piece.position.set(x - 3.5, 7 - y - 3.5, 1.25); // Ajustar altura
                board.add(piece);
                pieces[`${x},${y}`] = piece;
                x++;
            }
        }
    }
}
updatePieces();

// Configuración inicial de la cámara (perspectiva inclinada desde la derecha, como en la primera foto)
camera.position.set(10, -10, 10); // Posición inicial fija, inclinada hacia la derecha
camera.lookAt(new THREE.Vector3(0, 0, 1)); // Centrar en el centro del tablero

let zoomFactor = 1; // Declarar zoomFactor como variable global

// Eliminar rotación completamente (mantener solo zoom)
document.addEventListener('wheel', (e) => {
    zoomFactor += e.deltaY > 0 ? 0.1 : -0.1;
    zoomFactor = Math.max(0.1, Math.min(zoomFactor, 3)); // Zoom muy cercano (mínimo 1, máximo 30)
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
            zoomFactor = Math.max(0.1, Math.min(zoomFactor, 3));
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
        const pos = `${String.fromCharCode(97 + x)}${8 - y}`;
        // Solo permitir seleccionar piezas del jugador actual
        const pieceColor = game.get(pos).color;
        const currentTurn = game.turn(); // 'w' para blancas, 'b' para negras
        if (pieceColor === currentTurn) {
            selectedPiece = pos;
            piece.position.z = 1.5; // Elevar la pieza seleccionada
        }
    } else if (squareIntersects.length > 0 && selectedPiece) {
        const square = squareIntersects[0].object;
        const x = Math.floor(square.position.x + 3.5);
        const y = Math.floor(square.position.y + 3.5);
        const toPos = `${String.fromCharCode(97 + x)}${8 - y}`;
        // Verificar movimientos válidos usando chess.js
        const moves = game.moves({ square: selectedPiece, verbose: true });
        const isValidMove = moves.some(move => move.to === toPos);
        if (isValidMove) {
            const move = game.move({ from: selectedPiece, to: toPos });
            if (move) {
                updatePieces();
            }
        } else {
            // Restaurar si el movimiento no es válido
            const [oldX, oldY] = [selectedPiece.charCodeAt(0) - 97, 8 - parseInt(selectedPiece[1])];
            pieces[`${oldX},${oldY}`].position.z = 1.25;
        }
        selectedPiece = null;
    }
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();