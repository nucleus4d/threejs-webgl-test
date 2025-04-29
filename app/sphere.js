// Vertex shader
const vertexShaderSource = `#version 300 es
precision highp float;

in vec4 aPosition;
in vec4 aColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out vec4 vColor;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vColor = aColor;
}
`;

// Fragment shader
const fragmentShaderSource = `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
    fragColor = vColor;
}
`;

// Create and compile shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Create program
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// Generate sphere vertices
function generateSphereVertices(radius, segments) {
    const positions = [];
    const colors = [];
    const indices = [];

    // Generate vertices
    for (let lat = 0; lat <= segments; lat++) {
        const theta = lat * Math.PI / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let long = 0; long <= segments; long++) {
            const phi = long * 2 * Math.PI / segments;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = radius * sinTheta * cosPhi;
            const y = radius * sinTheta * sinPhi;
            const z = radius * cosTheta;

            positions.push(x, y, z);

            // Generate a color based on position
            const r = (sinTheta + 1) / 2;
            const g = (cosTheta + 1) / 2;
            const b = (sinPhi + 1) / 2;
            colors.push(r, g, b, 1.0);
        }
    }

    // Generate indices
    for (let lat = 0; lat < segments; lat++) {
        for (let long = 0; long < segments; long++) {
            const first = lat * (segments + 1) + long;
            const second = first + segments + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return { positions, colors, indices };
}

// Initialize WebGL context
export function initWebGL(gl, camera) {
    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return null;

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const colorLocation = gl.getAttribLocation(program, 'aColor');
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();

    // Generate sphere data
    const { positions, colors, indices } = generateSphereVertices(0.7, 32);

    // Create index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Upload color data
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Return the WebGL state
    return {
        gl,
        program,
        positionLocation,
        colorLocation,
        modelViewMatrixLocation,
        projectionMatrixLocation,
        positionBuffer,
        colorBuffer,
        indexBuffer,
        indicesLength: indices.length
    };
}

// Render the WebGL sphere
export function renderWebGLSphere(state, camera) {
    const {
        gl,
        program,
        positionLocation,
        colorLocation,
        modelViewMatrixLocation,
        projectionMatrixLocation,
        positionBuffer,
        colorBuffer,
        indexBuffer,
        indicesLength
    } = state;

    // Set up WebGL state
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);

    // Set up position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Set up color attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

    // Bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Get camera matrices
    const cameraMatrix = camera.matrixWorldInverse.elements;
    const cameraProjection = camera.projectionMatrix.elements;

    // Create model matrix with translation to avoid overlap with grid
    const modelMatrix = new Float32Array(16);
    modelMatrix[0] = 1;
    modelMatrix[5] = 1;
    modelMatrix[10] = 1;
    modelMatrix[12] = 0;
    modelMatrix[13] = 0;
    modelMatrix[14] = 0;
    modelMatrix[15] = 1;

    // Multiply camera matrix by model matrix
    const modelViewMatrix = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += cameraMatrix[i * 4 + k] * modelMatrix[k * 4 + j];
            }
            modelViewMatrix[i * 4 + j] = sum;
        }
    }

    // Set uniforms
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, cameraProjection);

    // Draw the sphere
    gl.drawElements(gl.TRIANGLES, indicesLength, gl.UNSIGNED_SHORT, 0);
} 