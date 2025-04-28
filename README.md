The purpose of this project is to provide a starting ground for integration of a raw WebGL2 content with a THREE.js scene.
Cameras, lighting, gridlines and controls are all THREE.js-based, where the content (a demo cube) is provided using raw WebGL2 code.

## Getting Started

First, install the dependencies (requires `npm` to be installed):

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Navigation
Use your left mouse button to rotate, and right to pan.

## Project structure
The `app/page.tsx` is a starting point of our Next.js app and consists of a `THREE.js` scene with a controllable camera, and three-axis grid planes.
It includes two methods from the `cube.js` file (which is a raw WebGL2-based file), which are `initWebGL` and `renderWebGLCube`. The `initWebGL` is called
upon scene set up, and it loads shader code etc. The `renderWebGLCube` is called upon each render cycle.

The `cube.js` file is a placeholder for any custom webgl2 rendering pipeline or a module.

_Note:_ We use the same `webgl2` context for both, our `THREE.js` scene and the raw WebGL2-based file.

Screenshot:
![Image](https://github.com/user-attachments/assets/6422800f-6259-46a3-b933-6c5980c5c534)
