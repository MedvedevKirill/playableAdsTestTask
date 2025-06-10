import './style.css';
import redCarImage from './assets/images/red.png';
import yellowCarImage from './assets/images/yellow.png';
import greenCarImage from './assets/images/green.png';
import blueCarImage from './assets/images/blue.png';
import handImage from './assets/images/hand.png';
import gsap from 'gsap';
import {
  Application,
  Assets,
  Graphics,
  Sprite,
  TextStyle,
  Text,
  Rectangle,
} from 'pixi.js';

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 700;

const app = new Application();

(async () => {
  await app.init({ background: '#545454', resizeTo: window });

  const rootElement = document.getElementById('game-root');
  if (!rootElement) throw new Error('game-root not found');
  rootElement.appendChild(app.canvas);

  let scale = Math.min(
    app.screen.width / LOGICAL_WIDTH,
    app.screen.height / LOGICAL_HEIGHT,
  );
  app.stage.scale.set(scale);
  app.stage.x = (app.screen.width - LOGICAL_WIDTH * scale) / 2;
  app.stage.y = (app.screen.height - LOGICAL_HEIGHT * scale) / 2;

  const blueCarTexture = await Assets.load(blueCarImage);
  const greenCarTexture = await Assets.load(greenCarImage);
  const redCarTexture = await Assets.load(redCarImage);
  const yellowCarTexture = await Assets.load(yellowCarImage);

  const inactiveCars = [blueCarTexture, greenCarTexture].map((texture) => {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.scale.set(0.5);
    return sprite;
  });

  const activeCars = [redCarTexture, yellowCarTexture].map((texture) => {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.scale.set(0.5);
    return sprite;
  });
  const redCar = activeCars[0];
  const yellowCar = activeCars[1];

  const parkingSpots = drawParking(inactiveCars);
  drawActiveCarsOnStartPos(activeCars);

  const redParking = parkingSpots[1];
  const yellowParking = parkingSpots[0];
  const hand = await initHand(
    redCar.x,
    redCar.y - 50,
    redParking.x + redParking.width / 2,
    redParking.y + redParking.height / 2,
  );

  app.ticker.add((time) => {
    //redCar.rotation += 0.1 * time.deltaTime;
  });
  window.addEventListener('resize', () => {
    scale = Math.min(
      app.screen.width / LOGICAL_WIDTH,
      app.screen.height / LOGICAL_HEIGHT,
    );
    app.stage.scale.set(scale);
    app.stage.x = (app.screen.width - LOGICAL_WIDTH * scale) / 2;
    app.stage.y = (app.screen.height - LOGICAL_HEIGHT * scale) / 2;
  });
})();

function drawActiveCarsOnStartPos(activeCars: Sprite[]): void {
  const carWidth = Math.max(activeCars[0].width, activeCars[1].width);
  const carHeight = Math.max(activeCars[0].height, activeCars[1].height);
  const bottomOffset = 40;
  const carY = LOGICAL_HEIGHT - carHeight / 2 - bottomOffset;
  const carGap = 300;
  const carsTotalWidth = 2 * carWidth + carGap;
  const carsStartX = (LOGICAL_WIDTH - carsTotalWidth) / 2;

  activeCars.forEach((car, i) => {
    const x = carsStartX + i * (carWidth + carGap);
    car.x = x + carWidth / 2;
    car.y = carY;
    app.stage.addChild(car);
  });
}

function drawParking(inactiveCars: Sprite[]): Rectangle[] {
  const spots: Rectangle[] = [];
  const addRenderedY = 2000;
  const gap = 20;
  const spotWidth = LOGICAL_WIDTH / 4 - gap;
  const spotHeight = LOGICAL_HEIGHT * 0.3;
  const topY = 0;
  const totalWidth = 4 * spotWidth + 3 * gap;
  const startX = (LOGICAL_WIDTH - totalWidth) / 2;

  for (let i = 0; i < 4; i++) {
    const x = startX + i * (spotWidth + gap);
    const y = topY;
    const topLineWidth = gap * 2.5;

    const spotBounds = new Rectangle(x, y, spotWidth, spotHeight);
    spots.push(spotBounds);
    // const spot = new Graphics();
    // spot.rect(spotBounds.x, spotBounds.y, spotBounds.width, spotBounds.height);
    // spot.stroke({ width: 3, color: 0xffffff });
    // spot.x = 0;
    // spot.y = 0;
    // app.stage.addChild(spot);

    const line = new Graphics();
    line.rect(-gap, -addRenderedY, gap, spotHeight + addRenderedY);
    line.roundRect(
      -(gap + topLineWidth) / 2,
      spotHeight - gap / 2,
      topLineWidth,
      gap,
      15,
    );
    line.fill('white');
    line.x = x;
    line.y = y;
    app.stage.addChild(line);

    if (i === 3) {
      const x = startX + 4 * (spotWidth + gap);
      const line = new Graphics();
      line.rect(-gap, -addRenderedY, gap, spotHeight + addRenderedY);
      line.roundRect(
        -(gap + topLineWidth) / 2,
        spotHeight - gap / 2,
        topLineWidth,
        gap,
        15,
      );
      line.fill('white');
      line.x = x;
      line.y = y;
      app.stage.addChild(line);
    }
  }
  spots.forEach((spot, i) => {
    switch (i) {
      case 0:
      case 3: {
        const car = inactiveCars[Number(i === 0)];
        car.x = spot.x + spot.width / 2;
        car.y = spot.y + spot.height / 2;
        car.rotation = Math.PI;
        app.stage.addChild(car);
        break;
      }
      case 1:
      case 2: {
        const label = new Text({
          text: 'P',
          style: new TextStyle({
            fontSize: 80,
            fill: `${i === 1 ? '#ffc841' : '#d1191f'}`,
            fontFamily: 'Arial',
            fontWeight: 'bold',
          }),
        });
        label.anchor.set(0.5);
        label.x = spot.x + spot.width / 2;
        label.y = spot.y + spot.height / 2;
        app.stage.addChild(label);
        break;
      }
    }
  });
  return spots.slice(1, 3);
}

async function initHand(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
): Promise<Sprite> {
  const texture = await Assets.load(handImage);
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.1);
  sprite.scale.set(0.5);
  sprite.eventMode = 'none';
  sprite.x = x;
  sprite.y = y;

  app.stage.addChild(sprite);
  gsap.to(sprite, {
    x: targetX,
    y: targetY,
    duration: 1.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
  return sprite;
}
