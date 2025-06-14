import { Container, Point, Sprite } from 'pixi.js';
import gsap from 'gsap';

export class FailScene {
  constructor(
    public sprite: Sprite,
    public layer: Container,
  ) {
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0);
    this.sprite.alpha = 0;
    this.sprite.eventMode = 'none';
  }

  public showFailView(pos: Point, onShowEnd: () => void): void {
    this.sprite.x = pos.x;
    this.sprite.y = pos.y;

    this.layer.addChild(this.sprite);

    gsap.to(this.sprite, {
      duration: 1.2,
      alpha: 1,
      pixi: {
        scale: 0.25,
      },
      ease: 'power2.out',
      onComplete: onShowEnd,
    });
  }

  public hideFailView(delay: number, onComplete: () => void): void {
    gsap.to(this.sprite, {
      duration: 1,
      delay,
      alpha: 0,
      pixi: {
        scale: 0,
      },
      ease: 'power2.out',
      onComplete: () => {
        this.layer.removeChild(this.sprite);
        this.sprite.destroy();
        onComplete();
      },
    });
  }
}
