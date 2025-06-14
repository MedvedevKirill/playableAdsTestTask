import { Application, Bounds, Point, Rectangle } from 'pixi.js';

export function getLocalBounds(bounds: Bounds, app: Application): Rectangle {
  const topLeft = app.stage.toLocal({ x: bounds.left, y: bounds.top });
  const bottomRight = app.stage.toLocal({ x: bounds.right, y: bounds.bottom });

  return new Rectangle(
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y,
  );
}

export function getSegmentsIntersection(
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
