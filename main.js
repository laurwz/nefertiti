const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene').appendChild(renderer.domElement);

// Fondo de estrellas
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const stars = new Array(1000).fill().map(() => [
    Math.random() * 200 - 100,
    Math.random() * 200 - 100,
    Math.random() * 200 - 100
]);
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars.flat(), 3));
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// Piezas placeholder (cubos)
const pieces = [];
const pieceNames = ['Peón', 'Caballo', 'Alfil', 'Torre', 'Reina', 'Rey', /* más piezas */];
for (let i = 0; i < 20; i++) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x4b2e83 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set((i % 5) * 2 - 4, Math.floor(i / 5) * 2 - 3, 0);
    scene.add(cube);
    pieces.push(cube);

    const div = document.createElement('div');
    div.className = 'piece-container';
    div.innerText = pieceNames[i % pieceNames.length] || `Pieza ${i + 1}`;
    div.style.left = `${((i % 5) * 20 + 10)}%`;
    div.style.top = `${(Math.floor(i / 5) * 20 + 10)}%`;
    document.body.appendChild(div);
}

camera.position.z = 10;

let isDragging = false, previousMouseX = 0;
document.addEventListener('mousedown', () => isDragging = true);
document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const delta = (e.clientX - previousMouseX) * 0.01;
        pieces.forEach(p => p.rotation.y += delta);
    }
    previousMouseX = e.clientX;
});

function animate() {
    requestAnimationFrame(animate);
    if (!isDragging) pieces.forEach(p => p.rotation.y += 0.01);
    renderer.render(scene, camera);
}
animate();
