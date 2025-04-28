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

    // Cube vertices (8 vertices) - centered around origin
    const positions = [
        // Front face
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,
        // Back face
        -0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5, -0.5, -0.5,
    ];

    // Cube colors (6 colors for 6 faces)
    const colors = [
        // Front face (red)
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        // Back face (green)
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        // Top face (blue)
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        // Bottom face (yellow)
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        // Right face (magenta)
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0,
        // Left face (cyan)
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
    ];

    // Cube indices
    const indices = [
        0, 1, 2,    0, 2, 3,    // front
        4, 5, 6,    4, 6, 7,    // back
        0, 4, 7,    0, 7, 1,    // bottom
        2, 6, 5,    2, 5, 3,    // top
        0, 3, 5,    0, 5, 4,    // left
        1, 7, 6,    1, 6, 2     // right
    ];

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

// Render the WebGL cube
export function renderWebGLCube(state, camera) {
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

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, indicesLength, gl.UNSIGNED_SHORT, 0);
} 