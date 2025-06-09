import './style.css';
import red from './assets/images/red.png';
import { Application, Assets, Sprite } from 'pixi.js';

(async () => {
  const app = new Application();

  await app.init({ background: '#545454', resizeTo: window });

  const rootElement = document.getElementById('game-root');
  if (!rootElement) throw new Error('game-root not found');

  rootElement.appendChild(app.canvas);

  const texture = await Assets.load(red);

  const redCar = new Sprite(texture);
  redCar.anchor.set(0.5);
  app.stage.addChild(redCar);

  redCar.x = app.screen.width / 2;
  redCar.y = app.screen.height / 2;

  app.ticker.add((time) => {
    redCar.rotation += 0.1 * time.deltaTime;
  });
})();
