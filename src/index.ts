import './style.css';
import redCarImage from './assets/images/red.png';
import yellowCarImage from './assets/images/yellow.png';
import greenCarImage from './assets/images/green.png';
import blueCarImage from './assets/images/blue.png';
import handImage from './assets/images/hand.png';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
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

gsap.registerPlugin(MotionPathPlugin);

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 700;
const RED_CAR_COLOR = '#d1191f';
const YELLOW_CAR_COLOR = '#ffc841';
const TRAIL_WIDTH = 40;
const CAR_ANIMATION_SPEED = 100;

type Car = {
  isPathPainted: boolean;
  sprite: Sprite;
  color: typeof RED_CAR_COLOR | typeof YELLOW_CAR_COLOR;
  trailRenderTexture: Texture;
  path: Point[];
};

let appState: {
  parkingSpots: Rectangle[];
  redCar: Car;
  yellowCar: Car;
  activeDrawing?: {
    car: Car;
    brush: Graphics;
    interpolatingLine: Graphics;
    path: Point[];
  };
  hand?: Sprite;
};

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

  const activeCars: Car[] = [redCarTexture, yellowCarTexture].map((texture) => {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.scale.set(0.5);
    const trailRenderTexture = RenderTexture.create({
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
    });
    app.stage.addChild(new Sprite(trailRenderTexture));
    return {
      sprite,
      color: texture === redCarTexture ? RED_CAR_COLOR : YELLOW_CAR_COLOR,
      isPathPainted: false,
      trailRenderTexture,
      path: new Array<Point>(),
    };
  });
  const backgroundLayer = new Container();
  app.stage.addChild(backgroundLayer);

  const activeLayer = new Container();
  app.stage.addChild(activeLayer);

  const parkingSpots = initParking(inactiveCars, backgroundLayer);
  initCars(activeCars, activeLayer);

  const redParking = parkingSpots[1];
  const yellowParking = parkingSpots[0];
  const hand = await initHand(
    activeCars[0].sprite.x,
    activeCars[0].sprite.y - 50,
    redParking.x + redParking.width / 2,
    redParking.y + redParking.height / 2,
    activeLayer,
  );

  appState = {
    parkingSpots,
    hand,
    redCar: activeCars[0],
    yellowCar: activeCars[1],
  };
  app.stage.eventMode = 'static';
  app.stage.hitArea = new Rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  app.ticker.add((time) => {
    //appState.redCar.sprite.rotation += 0.1 * time.deltaTime;
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

function initCars(activeCars: Car[], layer: Container): void {
  const carWidth = Math.max(
    activeCars[0].sprite.width,
    activeCars[1].sprite.width,
  );
  const carHeight = Math.max(
    activeCars[0].sprite.height,
    activeCars[1].sprite.height,
  );
  const bottomOffset = 40;
  const carY = LOGICAL_HEIGHT - carHeight / 2 - bottomOffset;
  const carGap = 300;
  const carsTotalWidth = 2 * carWidth + carGap;
  const carsStartX = (LOGICAL_WIDTH - carsTotalWidth) / 2;

  activeCars.forEach((car, i) => {
    const x = carsStartX + i * (carWidth + carGap);
    car.sprite.x = x + carWidth / 2;
    car.sprite.y = carY;
    layer.addChild(car.sprite);
    car.sprite.eventMode = 'static';
    car.sprite.cursor = 'pointer';
    car.sprite.on('pointerdown', (event: FederatedPointerEvent) =>
      onCarClick(event, car),
    );
  });
}

function onCarClick(event: FederatedPointerEvent, car: Car): void {
  if (car.isPathPainted) return;

  hideHand();

  const brush = new Graphics()
    .circle(0, 0, TRAIL_WIDTH / 2)
    .fill({ color: car.color });
  const interpolatingLine = new Graphics();
  const path = new Array<Point>();
  appState.activeDrawing = { brush, car, interpolatingLine, path };

  window.addEventListener('pointermove', onDraw);
  window.addEventListener('pointerup', endDraw);
  window.addEventListener('pointerupoutside', endDraw);
}

function initParking(inactiveCars: Sprite[], layer: Container): Rectangle[] {
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
    // layer.addChild(
    //   new Graphics()
    //     .rect(spotBounds.x, spotBounds.y, spotBounds.width, spotBounds.bottom)
    //     .stroke({ color: 'white', width: 5 }),
    // );
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
    layer.addChild(line);

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
      layer.addChild(line);
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
        layer.addChild(car);
        break;
      }
      case 1:
      case 2: {
        const label = new Text({
          text: 'P',
          style: new TextStyle({
            fontSize: 80,
            fill: `${i === 1 ? YELLOW_CAR_COLOR : RED_CAR_COLOR}`,
            fontFamily: 'Arial',
            fontWeight: 'bold',
          }),
        });
        label.anchor.set(0.5);
        label.x = spot.x + spot.width / 2;
        label.y = spot.y + spot.height / 2;
        layer.addChild(label);
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
  layer: Container,
): Promise<Sprite> {
  const texture = await Assets.load(handImage);
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.1);
  sprite.scale.set(0.5);
  sprite.eventMode = 'none';
  sprite.x = x;
  sprite.y = y;

  layer.addChild(sprite);
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

function hideHand(): void {
  const hand = appState.hand;
  if (!hand) return;

  gsap.killTweensOf(hand);
  gsap.to(hand, {
    alpha: 0,
    duration: 0.5,
    onComplete: () => {
      app.stage.removeChild(hand);
      hand.destroy();
    },
  });
}

function onDraw(event: PointerEvent): void {
  if (!appState.activeDrawing) return;

  const rect = app.canvas.getBoundingClientRect();
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;
  const { x, y } = app.stage.toLocal({ x: canvasX, y: canvasY });
  const { brush, path, interpolatingLine, car } = appState.activeDrawing;
  const lastPoint = path.at(-1);
  path.push(new Point(x, y));
  if (!canDrawHere(x, y)) {
    endDraw();
    return;
  }
  brush.position.set(x, y);
  app.renderer.render({
    container: brush,
    target: appState.activeDrawing.car.trailRenderTexture,
    clear: false,
  });
  if (lastPoint) {
    interpolatingLine
      .clear()
      .moveTo(lastPoint.x, lastPoint.y)
      .lineTo(x, y)
      .stroke({ width: TRAIL_WIDTH, color: car.color });
    app.renderer.render({
      container: interpolatingLine,
      target: appState.activeDrawing.car.trailRenderTexture,
      clear: false,
    });
  }
}

function endDraw(): void {
  if (!appState.activeDrawing) return;
  window.removeEventListener('pointermove', onDraw);
  window.removeEventListener('pointerup', endDraw);
  window.removeEventListener('pointerupoutside', endDraw);
  const lastPoint = appState.activeDrawing.path.at(-1);
  const isCorrect =
    lastPoint &&
    appState.parkingSpots[
      Number(appState.activeDrawing.car.color === RED_CAR_COLOR)
    ].contains(lastPoint.x, lastPoint.y);

  if (isCorrect) {
    appState.activeDrawing.car.sprite.eventMode = 'none';
    appState.activeDrawing.car.isPathPainted = true;
    appState.activeDrawing.car.path = appState.activeDrawing.path;
    if (appState.redCar.isPathPainted && appState.yellowCar.isPathPainted) {
      animateCarsToCollision(() => console.log('BAM!'));
    }
  } else {
    clearTrail(appState.activeDrawing.car.trailRenderTexture);
    appState.activeDrawing = undefined;
  }
}

function canDrawHere(x: number, y: number): boolean {
  if (
    !app.stage.hitArea?.contains(x, y) ||
    appState.parkingSpots[1].bottom >= y ||
    getLocalBounds(appState.redCar.sprite.getBounds()).bottom <= y ||
    (appState.activeDrawing?.car.color === RED_CAR_COLOR
      ? isPointInBounds(x, y, appState.yellowCar.sprite.getBounds())
      : isPointInBounds(x, y, appState.redCar.sprite.getBounds()))
  ) {
    return false;
  }

  return true;
}

function checkCarIntersect(carA: Car, carB: Car): boolean {
  const posA = carA.sprite.position;
  const posB = carB.sprite.position;

  const distance = Math.hypot(posB.x - posA.x, posB.y - posA.y);
  const minDistance = (1.5 * (carA.sprite.width + carB.sprite.width)) / 2;
  return distance <= minDistance;
}

function isPointInBounds(x: number, y: number, bounds: Bounds): boolean {
  const localBounds = getLocalBounds(bounds);
  return localBounds.contains(x, y);
}

function getLocalBounds(bounds: Bounds): Rectangle {
  const topLeft = app.stage.toLocal({ x: bounds.left, y: bounds.top });
  const bottomRight = app.stage.toLocal({ x: bounds.right, y: bounds.bottom });

  return new Rectangle(
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y,
  );
}

function clearTrail(texture: Texture) {
  app.renderer.render({
    container: new Graphics()
      .rect(0, 0, texture.width, texture.height)
      .fill({ color: 0x00000, alpha: 0 }),
    target: texture,
    clear: true,
  });
}

function cutPathsToIntersection(
  pathA: Point[],
  pathB: Point[],
): { pathANew: Point[]; pathBNew: Point[] } | null {
  for (let i = 0; i < pathA.length - 1; i++) {
    const a = pathA[i];
    const b = pathA[i + 1];

    for (let j = 0; j < pathB.length - 1; j++) {
      const c = pathB[j];
      const d = pathB[j + 1];

      const intersection = getSegmentsIntersection(a, b, c, d);
      if (intersection) {
        const pathANew = pathA.slice(0, i + 1);
        pathANew.push(intersection);
        const pathBNew = pathB.slice(0, j + 1);
        pathBNew.push(intersection);
        return {
          pathANew,
          pathBNew,
        };
      }
    }
  }
  return null;
}

function getSegmentsIntersection(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
): Point | null {
  // t(b.x - a.x) + u(c.x - d.x) = c.x - a.x
  // t(b.y - a.y) + u(c.y - d.y) = c.y - a.y
  const bax = b.x - a.x;
  const bay = b.y - a.y;
  const cdx = c.x - d.x;
  const cdy = c.y - d.y;
  const cax = c.x - a.x;
  const cay = c.y - a.y;
  const det = bax * cdy - bay * cdx;
  if (det === 0) return null;

  const t = (cax * cdy - cdx * cay) / det;
  const u = (bax * cay - bay * cax) / det;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    const x = a.x + t * bax;
    const y = a.y + t * bay;
    return new Point(x, y);
  }

  return null;
}

function animateCarAlongPath(
  car: Car,
  duration = 2,
  onComplete?: () => void,
): void {
  let killThem = false;
  gsap.to(car.sprite, {
    motionPath: {
      path: car.path.filter(
        (_, i) => i % 100 === 0 || i === car.path.length - 1,
      ),
      autoRotate: Math.PI / 2,
      curviness: 1,
      useRadians: true,
    },
    duration,
    ease: 'none',
    onComplete,
    onUpdate: (): void => {
      if (killThem) {
        gsap.killTweensOf(appState.redCar.sprite);
        gsap.killTweensOf(appState.yellowCar.sprite);
        return;
      }
      if (checkCarIntersect(appState.redCar, appState.yellowCar)) {
        killThem = true;
      }
    },
  });
}

function animateCarsToCollision(onCollision: () => void) {
  const intersectionPaths = cutPathsToIntersection(
    appState.redCar.path,
    appState.yellowCar.path,
  );
  if (!intersectionPaths) return;

  const { pathANew: redPath, pathBNew: yellowPath } = intersectionPaths;
  appState.redCar.path = redPath;
  appState.yellowCar.path = yellowPath;
  const redDistance = getPathLength(redPath);
  const yellowDistance = getPathLength(yellowPath);
  const maxDuration =
    Math.max(redDistance, yellowDistance) / CAR_ANIMATION_SPEED;

  animateCarAlongPath(appState.redCar, maxDuration, undefined);

  animateCarAlongPath(appState.yellowCar, maxDuration, onCollision);
}

function getPathLength(path: Point[]): number {
  let dist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    dist += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return dist;
}
