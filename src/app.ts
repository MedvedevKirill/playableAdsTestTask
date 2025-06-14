import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  TextStyle,
  Text,
  FederatedPointerEvent,
  Point,
} from 'pixi.js';
import {
  ACTIVE_CARS_SPRITES,
  CAR_ANIMATION_SPEED,
  CARS_START_BOTTOM,
  CARS_START_GAP,
  FAIL_HIDE_DELAY,
  FAIL_SPRITE,
  FIRST_CAR_COLOR,
  HINT_HAND_SPRITE,
  INACTIVE_CARS_SPRITES,
  INACTIVITY_WAIT_TIME,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SECOND_CAR_COLOR,
  TRAIL_WIDTH,
} from './constants';
import { Car } from './car';
import { DrawingTrajectory } from './utils/drawing-trajectory';
import { HintHand } from './hint-hand';
import { getLocalBounds } from './utils/helpers';
import playNowButtonImage from './assets/images/button_green.png';
import logoImage from './assets/images/gamelogo.png';
import { FailScene } from './fail-scene';

export type CarColor = typeof FIRST_CAR_COLOR | typeof SECOND_CAR_COLOR;

export class App {
  public readonly app: Application;
  public readonly activeLayer: Container;
  public readonly backgroundLayer: Container;
  public readonly overlayLayer: Container;
  public parkingSpots: Rectangle[] = [];
  public cars: Car[] = [];
  public scale: number = 1;
  public hand?: HintHand;
  public failScene?: FailScene;
  private currentDrawingCar?: Car;
  private timeout?: ReturnType<typeof setTimeout>;
  private onDrawBind = this.onDraw.bind(this);
  private endDrawBind = this.endDraw.bind(this);
  constructor(app: Application) {
    this.app = app;

    this.backgroundLayer = new Container();
    this.app.stage.addChild(this.backgroundLayer);

    this.activeLayer = new Container();
    this.app.stage.addChild(this.activeLayer);

    this.overlayLayer = new Container();
    this.app.stage.addChild(this.overlayLayer);

    this.init();
  }

  public init(): void {
    this.updateScale();

    this.parkingSpots = this.initParking(
      INACTIVE_CARS_SPRITES,
      this.backgroundLayer,
    );
    this.cars = this.initCars(ACTIVE_CARS_SPRITES, this.activeLayer);
    this.failScene = new FailScene(FAIL_SPRITE, this.overlayLayer);
    this.hand = new HintHand(HINT_HAND_SPRITE);
    this.hand.init(
      this.cars[0].sprite.position,
      new Point(
        this.parkingSpots[1].x + this.parkingSpots[1].width / 2,
        this.parkingSpots[1].y + this.parkingSpots[1].height / 2,
      ),
      this.overlayLayer,
    );

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new Rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    this.restartTimeout();

    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this.updateScale();
    });
  }

  private updateScale(): void {
    this.scale = Math.min(
      this.app.screen.width / LOGICAL_WIDTH,
      this.app.screen.height / LOGICAL_HEIGHT,
    );
    this.app.stage.scale.set(this.scale);
    this.app.stage.x = (this.app.screen.width - LOGICAL_WIDTH * this.scale) / 2;
    this.app.stage.y =
      (this.app.screen.height - LOGICAL_HEIGHT * this.scale) / 2;
  }

  private initParking(inactiveCars: Sprite[], layer: Container): Rectangle[] {
    const spots: Rectangle[] = [];
    const spotsLength = 4;
    const spotHeightMulti = 0.3;
    const addRenderedY = 2000;
    const gap = 20;
    const spotWidth = LOGICAL_WIDTH / spotsLength - gap;
    const spotHeight = LOGICAL_HEIGHT * spotHeightMulti;
    const totalWidth = spotsLength * spotWidth + (spotsLength - 1) * gap;
    const startX = (LOGICAL_WIDTH - totalWidth) / 2;
    const startY = 0;

    for (let i = 0; i < spotsLength; i++) {
      const x = startX + i * (spotWidth + gap);
      const y = startY;
      const horizontalLineWidth = gap * 2.5;
      const horizontalLineRad = 15;

      const spotBounds = new Rectangle(x, y, spotWidth, spotHeight);
      spots.push(spotBounds);
      // layer.addChild(
      //   new Graphics()
      //     .rect(spotBounds.x, spotBounds.y, spotBounds.width, spotBounds.bottom)
      //     .stroke({ color: 'white', width: 5 }),
      // );
      const line = new Graphics();
      line.rect(-gap, -addRenderedY, gap, spotHeight + addRenderedY); // Vertical line
      line.roundRect(
        -(gap + horizontalLineWidth) / 2,
        spotHeight - gap / 2,
        horizontalLineWidth,
        gap,
        horizontalLineRad,
      ); // Horizontal line
      line.fill('white');
      line.x = x;
      line.y = y;
      layer.addChild(line);

      if (i === spotsLength - 1) {
        // Last vertical line
        const x = startX + spotsLength * (spotWidth + gap);
        const line = new Graphics();
        line.rect(-gap, -addRenderedY, gap, spotHeight + addRenderedY);
        line.roundRect(
          -(gap + horizontalLineWidth) / 2,
          spotHeight - gap / 2,
          horizontalLineWidth,
          gap,
          horizontalLineRad,
        ); // Last horizontal line
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
          car.scale.set(0.5);
          car.anchor.set(0.5);
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
              fill: `${i === 1 ? SECOND_CAR_COLOR : FIRST_CAR_COLOR}`,
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

  private initCars(activeCarsSprites: Sprite[], layer: Container): Car[] {
    const cars = activeCarsSprites.map((carSprite, i) => {
      carSprite.scale.set(0.5);
      carSprite.anchor.set(0.5);
      const color = i === 0 ? FIRST_CAR_COLOR : SECOND_CAR_COLOR;
      const trajectory = new DrawingTrajectory(
        LOGICAL_WIDTH,
        LOGICAL_HEIGHT,
        new Graphics().circle(0, 0, TRAIL_WIDTH / 2).fill({ color }),
        [],
        this.app,
        color,
        window.devicePixelRatio,
      );
      layer.addChild(trajectory.sprite);
      return new Car(carSprite, color, trajectory);
    });

    const carWidth = Math.max(cars[0].sprite.width, cars[1].sprite.width);
    const carHeight = Math.max(cars[0].sprite.height, cars[1].sprite.height);
    const carY = LOGICAL_HEIGHT - carHeight / 2 - CARS_START_BOTTOM;
    const carsTotalWidth = 2 * carWidth + CARS_START_GAP;
    const carsStartX = (LOGICAL_WIDTH - carsTotalWidth) / 2;

    cars.forEach((car, i) => {
      const x = carsStartX + i * (carWidth + CARS_START_GAP);
      car.sprite.x = x + carWidth / 2;
      car.sprite.y = carY;
      layer.addChild(car.sprite);
      car.sprite.eventMode = 'static';
      car.sprite.cursor = 'pointer';
      car.sprite.on('pointerdown', (event: FederatedPointerEvent) =>
        this.onCarClick(event, car),
      );
    });
    return cars;
  }

  private restartTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.hand?.hideHand();
      this.showFinalScene();
    }, INACTIVITY_WAIT_TIME);
  }

  private onCarClick(event: FederatedPointerEvent, car: Car): void {
    this.restartTimeout();
    if (car.isPathPainted) return;

    this.hand?.hideHand();

    this.currentDrawingCar = car;
    car.isPathPainted = false;

    window.addEventListener('pointermove', this.onDrawBind);
    window.addEventListener('pointerup', this.endDrawBind);
    window.addEventListener('pointerupoutside', this.endDrawBind);
  }
  private onDraw(event: PointerEvent): void {
    this.restartTimeout();
    if (!this.currentDrawingCar) return;

    const rect = this.app.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const { x, y } = this.app.stage.toLocal({ x: canvasX, y: canvasY });
    const path = this.currentDrawingCar.trajectory.path;

    const lastPoint = path.at(-1);
    path.push(new Point(x, y));
    if (!this.canDrawHere(x, y)) {
      this.endDraw();
      return;
    }
    this.currentDrawingCar.trajectory.drawDot(x, y);
    if (lastPoint) {
      this.currentDrawingCar.trajectory.drawInterpolatingLine(
        lastPoint,
        new Point(x, y),
      );
    }
  }

  private endDraw(): void {
    this.restartTimeout();
    if (!this.currentDrawingCar) return;
    window.removeEventListener('pointermove', this.onDrawBind);
    window.removeEventListener('pointerup', this.endDrawBind);
    window.removeEventListener('pointerupoutside', this.endDrawBind);
    const lastPoint = this.currentDrawingCar.trajectory.path.at(-1);
    const isCorrectParking =
      lastPoint &&
      this.parkingSpots[
        this.currentDrawingCar.color === FIRST_CAR_COLOR ? 1 : 0
      ].contains(lastPoint.x, lastPoint.y);

    if (isCorrectParking) {
      this.currentDrawingCar.sprite.eventMode = 'none';
      this.currentDrawingCar.isPathPainted = true;
      if (this.cars.every((car) => car.isPathPainted)) {
        clearTimeout(this.timeout);
        this.animateCarsToCollision(() => {
          this.failScene?.showFailView(
            new Point(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2),
            () =>
              this.failScene?.hideFailView(
                FAIL_HIDE_DELAY,
                this.showFinalScene,
              ),
          );
        });
      }
    } else {
      this.currentDrawingCar.trajectory.clear();
      this.currentDrawingCar = undefined;
    }
  }

  private canDrawHere(x: number, y: number): boolean {
    if (
      !this.app.stage.hitArea?.contains(x, y) ||
      this.parkingSpots[1].bottom >= y ||
      getLocalBounds(this.cars[0].sprite.getBounds(), this.app).bottom <= y ||
      getLocalBounds(
        this.cars
          .filter((car) => car !== this.currentDrawingCar)[0]
          .sprite.getBounds(),
        this.app,
      ).contains(x, y)
    ) {
      return false;
    }

    return true;
  }

  private animateCarsToCollision(onCollision: () => void) {
    const firstCar = this.cars[0];
    const secondCar = this.cars[1];
    const intersectionPaths = DrawingTrajectory.cutPathsToIntersection(
      firstCar.trajectory.path,
      secondCar.trajectory.path,
    );
    if (!intersectionPaths) return;

    const { pathANew: firstPath, pathBNew: secondPath } = intersectionPaths;
    firstCar.trajectory.path = firstPath;
    secondCar.trajectory.path = secondPath;
    const firstPathDistance = DrawingTrajectory.getPathLength(firstPath);
    const secondPathDistance = DrawingTrajectory.getPathLength(secondPath);
    const maxDuration =
      Math.max(firstPathDistance, secondPathDistance) / CAR_ANIMATION_SPEED;

    firstCar.trajectory.animateSpriteAlongPath(
      firstCar.sprite,
      maxDuration,
      Math.PI / 2,
    );

    secondCar.trajectory.animateSpriteAlongPath(
      secondCar.sprite,
      maxDuration,
      Math.PI / 2,
      onCollision,
      (): void => {
        if (secondCar.checkCarIntersect(firstCar)) {
          DrawingTrajectory.stopAnimations(firstCar.sprite);
          DrawingTrajectory.stopAnimations(secondCar.sprite);
          onCollision();
        }
      },
    );
  }

  public showFinalScene(): void {
    const dialog = document.getElementById('final-dialog') as HTMLDialogElement;
    const buttonImage = document.getElementById(
      'button-play-now-logo',
    ) as HTMLImageElement;
    buttonImage.src = playNowButtonImage;
    const gameLogo = document.getElementById('final-logo') as HTMLImageElement;
    gameLogo.src = logoImage;

    dialog.showModal();
  }
}
