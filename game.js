// Crear la escena de Three.js
const scene = new THREE.Scene();

// Configurar la cámara con perspectiva
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Configurar el renderizador WebGL
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Añadir el canvas al cuerpo del HTML

// Añadir una luz ambiental suave
const ambientLight = new THREE.AmbientLight(0x404040); // luz suave y difusa
scene.add(ambientLight);

// Añadir luz direccional para crear sombras y efectos en el mármol
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Crear el tablero de ajedrez (plano 3D de mármol)
const boardGeometry = new THREE.PlaneGeometry(8, 8);  // El tamaño del tablero es 8x8
const boardMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,   // Color base del mármol
    specular: 0xeeeeee,  // Brillo especular
    shininess: 100,     // Brillo del mármol
    side: THREE.DoubleSide
});

const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.rotation.x = -Math.PI / 2; // Hacer que el tablero quede plano
scene.add(board);

// Crear las casillas del tablero (alternando colores)
const squareGeometry = new THREE.PlaneGeometry(1, 1);
const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const material = (i + j) % 2 === 0 ? whiteMaterial : blackMaterial;
        const square = new THREE.Mesh(squareGeometry, material);
        square.position.set(i - 3.5, j - 3.5, 0);  // Posicionar las casillas
        scene.add(square);
    }
}

// Configurar la cámara para ver el tablero desde arriba
camera.position.z = 10;

// Habilitar rotación y zoom del tablero con el mouse
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationX = 0;
let rotationY = 0;

document.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        rotationX += deltaY * 0.01;
        rotationY += deltaX * 0.01;
        board.rotation.x = rotationX;
        board.rotation.y = rotationY;
    }
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

// Función de animación para renderizar la escena continuamente
function animate() {
    requestAnimationFrame(animate);  // Recursividad para actualizar el renderizado
    renderer.render(scene, camera);  // Renderizar la escena y la cámara
}

// Llamar a la función de animación
animate();
