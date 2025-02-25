<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juego de Ajedrez Esotérico</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background: #1a0d2b;
            color: #d4aaff;
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body>
    <h1 style="text-align: center;">Ajedrez Esotérico</h1>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
    <script>
        // Crear la escena de Three.js
        const scene = new THREE.Scene();

        // Configurar la cámara con perspectiva
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Configurar el renderizador WebGL
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement); // Añadir el canvas al cuerpo del HTML

        // Añadir una luz ambiental suave
        const ambientLight = new THREE.AmbientLight(0x404040); // luz suave y difusa
        scene.add(ambientLight);

        // Añadir luz direccional para crear sombras y efectos en el mármol
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5).normalize();
        scene.add(directionalLight);

        // Cargar la textura de mármol para el tablero
        const textureLoader = new THREE.TextureLoader();
        const marbleTexture = textureLoader.load('https://raw.githubusercontent.com/laurwz/nefertiti/main/marble-texture.jpg');  // Cambia la URL de la textura

        // Crear el tablero de ajedrez (plano 3D de mármol)
        const boardGeometry = new THREE.PlaneGeometry(8, 8);  // El tamaño del tablero es 8x8
        const boardMaterial = new THREE.MeshPhongMaterial({
            map: marbleTexture,  // Usar la textura de mármol
            specular: 0xeeeeee,  // Brillo especular
            shininess: 100,     // Brillo del mármol
            side: THREE.DoubleSide
        });

        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.rotation.x = -Math.PI / 2; // Hacer que el tablero quede plano
        scene.add(board);

        // Crear las casillas del tablero (alternando colores)
        const squareGeometry = new THREE.PlaneGeometry(1, 1);
        const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

        let squares = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const material = (i + j) % 2 === 0 ? whiteMaterial : blackMaterial;
                const square = new THREE.Mesh(squareGeometry, material);
                square.position.set(i - 3.5, j - 3.5, 0);  // Posicionar las casillas
                board.add(square);  // Añadir las casillas como hijas del tablero
                squares.push(square); // Guardar las casillas en un array
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

        // Variables para el zoom
        let zoomFactor = 1;
        const zoomSpeed = 0.1;  // Velocidad del zoom

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
                
                // Limitar la rotación para no permitir que gire demasiado hacia abajo
                rotationY += deltaX * 0.01;  // Solo rotación en Y (horizontal)
                
                // Asegurarse de que no gire hacia arriba o hacia abajo
                if (rotationX > Math.PI / 4) rotationX = Math.PI / 4;
                if (rotationX < -Math.PI / 4) rotationX = -Math.PI / 4;

                board.rotation.x = rotationX;  // Rotación solo en X (vertical)
                board.rotation.y = rotationY;  // Rotación solo en Y (horizontal)
            }
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
        });

        // Función para el zoom con rueda del ratón
        document.addEventListener('wheel', (e) => {
            // Zoom solo en la escena 3D, no en la web
            if (e.deltaY > 0) {
                zoomFactor += zoomSpeed;  // Acercar
            } else {
                zoomFactor -= zoomSpeed;  // Alejar
            }

            // Limitar el zoom
            zoomFactor = Math.max(1, Math.min(zoomFactor, 5));
            camera.position.z = zoomFactor * 10;  // Ajustar la posición de la cámara para el zoom
            e.preventDefault();  // Prevenir el zoom de la página web
        });

        // Función para el zoom con gestos táctiles (móvil)
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
                }
            }
        });

        // Iniciar la distancia inicial del toque
        let initialTouchDistance = 0;
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialTouchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            }
        });

        // Función de animación para renderizar la escena continuamente
        function animate() {
            requestAnimationFrame(animate);  // Recursividad para actualizar el renderizado
            renderer.render(scene, camera);  // Renderizar la escena y la cámara
        }

        // Llamar a la función de animación
        animate();
    </script>
</body>
</html>
