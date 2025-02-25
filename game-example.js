// Usar la versión r153 de Three.js
const THREE = window.THREE;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Iluminación avanzada
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 10, 10).normalize();
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Fondo de cielo estrellado
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 300;
    const y = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, sizeAttenuation: true });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Tablero con textura PBR
const textureLoader = new THREE.TextureLoader();
const marbleTexture = textureLoader.load('https://cdn.pixabay.com/photo/2016/03/27/18/54/texture-1283625_1280.jpg');
marbleTexture.wrapS = THREE.RepeatWrapping;
marbleTexture.wrapT = THREE.RepeatWrapping;
marbleTexture.repeat.set(8, 8);
const boardGeometry = new THREE.BoxGeometry(8, 8, 0.5);
const boardMaterial = new THREE.MeshStandardMaterial({
    map: marbleTexture,
    metalness: 0.1,
    roughness: 0.5,
    normalMap: textureLoader.load('https://i.imgur.com/abc123.png'), // Ejemplo (ajusta)
    aoMap: textureLoader.load('https://i.imgur.com/xyz789.png') // Ejemplo (ajusta)
});
const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.position.z = 0.25;
board.rotation.set(0, 0, 0);
board.receiveShadow = true;
scene.add(board);

// Casillas (opcional)
const squareGeometry = new THREE.PlaneGeometry(1, 1);
const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
let squares = [];
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const material = (i + j) % 2 === 0 ? whiteMaterial : blackMaterial;
        const square = new THREE.Mesh(squareGeometry, material);
        square.position.set(i - 3.5, j - 3.5, 0.26);
        square.receiveShadow = true;
        board.add(square);
        squares.push(square);
    }
}

// Lógica del ajedrez
const game = new Chess();
const pieceGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Placeholder
const pieceMaterials = {
    'w': new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.5 }),
    'b': new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.2, roughness: 0.5 })
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
                piece.position.set(x - 3.5, 7 - y - 3.5, 0.5);
                piece.castShadow = true;
                piece.receiveShadow = true;
                board.add(piece);
                pieces[`${x},${8 - y}`] = piece;
                x++;
            }
        }
    }
}
updatePieces();

// Cámara fija y zoom cercano
camera.position.set(4, -4, 2);
camera.lookAt(new THREE.Vector3(0, 0, 0.25));

let zoomFactor = 1;

document.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomFactor += e.deltaY > 0 ? 0.1 : -0.1;
    zoomFactor = Math.max(0.05, Math.min(zoomFactor, 0.5));
    const targetPosition = new THREE.Vector3(4, -4, zoomFactor * 2);
    camera.position.lerpVectors(targetPosition, camera.position, 0.1);
    camera.lookAt(new THREE.Vector3(0, 0, 0.25));
}, { passive: false });

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
            zoomFactor = Math.max(0.05, Math.min(zoomFactor, 0.5));
            const targetPosition = new THREE.Vector3(4, -4, zoomFactor * 2);
            camera.position.lerpVectors(targetPosition, camera.position, 0.1);
            camera.lookAt(new THREE.Vector3(0, 0, 0.25));
            initialTouchDistance = currentDistance;
        }
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Postprocesado con Bloom
const { EffectComposer, RenderPass, BloomPass } = THREE;
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new BloomPass(1.0, 25, 4.0, 512);
composer.addPass(renderPass);
composer.addPass(bloomPass);

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
        const pieceColor = game.get(pos).color;
        const currentTurn = game.turn();
        if (pieceColor === currentTurn) {
            selectedPiece = pos;
            piece.position.z = 0.75;
        }
    } else if (squareIntersects.length > 0 && selectedPiece) {
        const square = squareIntersects[0].object;
        const x = Math.floor(square.position.x + 3.5);
        const y = Math.floor(square.position.y + 3.5);
        const toPos = `${String.fromCharCode(97 + x)}${8 - y}`;
        const move = game.move({
            from: selectedPiece,
            to: toPos,
            promotion: 'q'
        });
        if (move) {
            updatePieces();
            const [newX, newY] = [toPos.charCodeAt(0) - 97, 8 - parseInt(toPos[1])];
            new TWEEN.Tween(pieces[`${newX},${newY}`].position)
                .to({ z: 0.75 }, 200)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onComplete(() => {
                    pieces[`${newX},${newY}`].position.z = 0.5;
                })
                .start();
        } else {
            const [oldX, oldY] = [selectedPiece.charCodeAt(0) - 97, 8 - parseInt(selectedPiece[1])];
            pieces[`${oldX},${oldY}`].position.z = 0.5;
        }
        selectedPiece = null;
    }
});

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    composer.render();
    renderer.render(scene, camera);
}