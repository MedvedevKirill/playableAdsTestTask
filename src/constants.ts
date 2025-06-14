import redCarImage from './assets/images/red.png';
import yellowCarImage from './assets/images/yellow.png';
import greenCarImage from './assets/images/green.png';
import blueCarImage from './assets/images/blue.png';
import handImage from './assets/images/hand.png';
import failImage from './assets/images/fail3.png';
import { Assets, Sprite } from 'pixi.js';

const redCarTexture = await Assets.load(redCarImage);
const yellowCarTexture = await Assets.load(yellowCarImage);
const greenCarTexture = await Assets.load(greenCarImage);
const blueCarTexture = await Assets.load(blueCarImage);
const handTexture = await Assets.load(handImage);
const failTexture = await Assets.load(failImage);

export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 700;
export const FIRST_CAR_COLOR = '#d1191f';
export const SECOND_CAR_COLOR = '#ffc841';
export const TRAIL_WIDTH = 40;
export const CARS_START_GAP = 300;
export const CARS_START_BOTTOM = 40;
export const CAR_ANIMATION_SPEED = 100;
export const FAIL_HIDE_DELAY = 1.25;
export const INACTIVITY_WAIT_TIME = 20000;
export const HINT_HAND_ONE_MOVE_DURATION = 1.2;
export const HINT_HAND_START_Y_OFFSET = -50;
export const CAR_INTERSECT_WITH_MULTI = 1.2;
export const ACTIVE_CARS_SPRITES = [redCarTexture, yellowCarTexture].map(
  (texture) => new Sprite(texture),
);
export const INACTIVE_CARS_SPRITES = [blueCarTexture, greenCarTexture].map(
  (texture) => new Sprite(texture),
);
export const HINT_HAND_SPRITE = new Sprite(handTexture);
export const FAIL_SPRITE = new Sprite(failTexture);
