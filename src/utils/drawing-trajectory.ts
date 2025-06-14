import { Application, Graphics, Point, RenderTexture, Sprite } from 'pixi.js';
import { FIRST_CAR_COLOR, SECOND_CAR_COLOR, TRAIL_WIDTH } from '../constants';
import { CarColor } from '../app';
import { getSegmentsIntersection } from './helpers';
import gsap from 'gsap';

export class DrawingTrajectory {
  private interpolatingLine: Graphics;

  public readonly texture: RenderTexture;
  public readonly sprite: Sprite;
  public path: Point[];
  public brush: Graphics;
  public app: Application;
  public color: CarColor;

  constructor(
    width: number,
    height: number,
    brush: Graphics,
    path: Point[],
    app: Application,
    color: typeof FIRST_CAR_COLOR | typeof SECOND_CAR_COLOR,
    resolution?: number,
  ) {
    this.texture = RenderTexture.create({ width, height, resolution });
    this.path = path;
    this.brush = brush;
    this.sprite = new Sprite(this.texture);
    this.app = app;
    this.interpolatingLine = new Graphics();
    this.color = color;
  }

  public clear(): void {
    this.app.renderer.render({
      container: new Graphics()
        .rect(0, 0, this.texture.width, this.texture.height)
        .fill({ color: 0x00000, alpha: 0 }),
      target: this.texture,
      clear: true,
    });
    this.path = [];
  }

  public drawDot(x: number, y: number): void {
    this.brush.position.set(x, y);
    this.app.renderer.render({
      container: this.brush,
      target: this.texture,
      clear: false,
    });
  }

  public drawInterpolatingLine(from: Point, to: Point): void {
    this.interpolatingLine
      .clear()
      .moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ width: TRAIL_WIDTH, color: this.color });
    this.app.renderer.render({
      container: this.interpolatingLine,
      target: this.texture,
      clear: false,
    });
  }

  public static getPathLength(path: Point[]): number {
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      dist += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return dist;
  }

  public static calculatePathStep(length: number): number {
    if (length < 25) return 1;
    if (length < 50) return 2;
    if (length < 100) return 5;
    if (length < 500) return 25;
    if (length < 1000) return 50;
    return 100;
  }

  public static cutPathsToIntersection(
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

  public animateSpriteAlongPath(
    sprite: Sprite,
    duration = 2,
    rotationOffset: number,
    onComplete?: () => void,
    onUpdate?: () => void,
  ): void {
    const step = DrawingTrajectory.calculatePathStep(this.path.length);
    const smoothPath = this.path.filter(
      (_, i) => i % step === 0 || i === this.path.length - 1,
    );
    gsap.to(sprite, {
      motionPath: {
        path: smoothPath,
        autoRotate: rotationOffset,
        curviness: 1,
        useRadians: true,
      },
      duration,
      ease: 'none',
      onComplete,
      onUpdate,
      // onUpdate: onComplete
      //   ? (): void => {
      //       if (checkCarIntersect(appState.redCar, appState.yellowCar)) {
      //         gsap.killTweensOf(appState.redCar.sprite);
      //         gsap.killTweensOf(appState.yellowCar.sprite);
      //         onComplete();
      //       }
      //     }
      //   : undefined,
    });
  }
  public static stopAnimations(sprite: Sprite): void {
    gsap.killTweensOf(sprite);
  }
}
