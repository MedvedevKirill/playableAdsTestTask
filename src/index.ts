import './style.css';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { PixiPlugin } from 'gsap/PixiPlugin';
import {
  Application,
  Assets,
  Graphics,
  Sprite,
  TextStyle,
  Text,
  Rectangle,
  FederatedPointerEvent,
  RenderTexture,
  Point,
  Texture,
  Container,
  Bounds,
} from 'pixi.js';
import { App } from './app';

gsap.registerPlugin(MotionPathPlugin, PixiPlugin);
PixiPlugin.registerPIXI({
  Application,
  Assets,
  Graphics,
  Sprite,
  TextStyle,
  Text,
  Rectangle,
  FederatedPointerEvent,
  RenderTexture,
  Point,
  Texture,
  Container,
  Bounds,
});
const pixiApp = new Application();

(async () => {
  await pixiApp.init({
    background: '#545454',
    resizeTo: window,
    resolution: window.devicePixelRatio,
  });
  const rootElement = document.getElementById('game-root');
  if (!rootElement) throw new Error('game-root not found');
  rootElement.appendChild(pixiApp.canvas);
  new App(pixiApp);
})();
