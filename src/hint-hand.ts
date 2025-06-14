import { Container, Point, Sprite } from 'pixi.js';
import {
  HINT_HAND_ONE_MOVE_DURATION,
  HINT_HAND_START_Y_OFFSET,
} from './constants';
import gsap from 'gsap';

export class HintHand {
  private onHide = () => {};

  constructor(public sprite: Sprite) {}

  public init(start: Point, target: Point, layer: Container) {
    this.sprite.anchor.set(0.1);
    this.sprite.scale.set(0.5);
    this.sprite.eventMode = 'none';
    this.sprite.x = start.x;
    this.sprite.y = start.y + HINT_HAND_START_Y_OFFSET;
    this.onHide = () => {
      layer.removeChild(this.sprite);
      this.sprite.destroy();
    };
    layer.addChild(this.sprite);
    gsap.to(this.sprite, {
      x: target.x,
      y: target.y,
      duration: HINT_HAND_ONE_MOVE_DURATION,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  public hideHand(): void {
    gsap.killTweensOf(this.sprite);
    gsap.to(this.sprite, {
      alpha: 0,
      duration: 0.5,
      onComplete: this.onHide,
    });
  }
}
