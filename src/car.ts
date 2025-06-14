import { Sprite } from 'pixi.js';
import { CAR_INTERSECT_WITH_MULTI } from './constants';
import { DrawingTrajectory } from './utils/drawing-trajectory';
import { CarColor } from './app';

export class Car {
  public isPathPainted: boolean = false;
  public sprite: Sprite;
  public color: CarColor;
  public trajectory: DrawingTrajectory;

  constructor(
    sprite: Sprite,
    color: typeof this.color,
    trajectory: DrawingTrajectory,
  ) {
    this.sprite = sprite;
    this.color = color;
    this.trajectory = trajectory;
  }

  public checkCarIntersect(car: Car): boolean {
    const posA = this.sprite.position;
    const posB = car.sprite.position;

    const distance = Math.hypot(posB.x - posA.x, posB.y - posA.y);
    const minDistance =
      (CAR_INTERSECT_WITH_MULTI * (this.sprite.width + car.sprite.width)) / 2;
    return distance <= minDistance;
  }
}
