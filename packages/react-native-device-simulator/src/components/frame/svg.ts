/**
 * String helpers for the SVG artwork carried by device presets. Pure: no React,
 * no platform code, so everything here is unit-testable.
 */
import type { Orientation, Size } from '../../types';

/** Natural size of an SVG document, from its `viewBox` (or `width`/`height`). */
export function svgNaturalSize(xml: string): Size | null {
  const root = /<svg\b([^>]*)>/i.exec(xml)?.[1];
  if (root == null) return null;
  const viewBox = /\bviewBox\s*=\s*["']([^"']+)["']/i.exec(root)?.[1];
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    const width = parts[2];
    const height = parts[3];
    if (parts.length === 4 && width != null && height != null && width > 0 && height > 0) return { width, height };
  }
  const width = Number(/\bwidth\s*=\s*["']([\d.]+)/i.exec(root)?.[1]);
  const height = Number(/\bheight\s*=\s*["']([\d.]+)/i.exec(root)?.[1]);
  return width > 0 && height > 0 ? { width, height } : null;
}

/** The markup between the root `<svg>` tags (the document itself when it has no root). */
export function svgContent(xml: string): string {
  const match = /<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/i.exec(xml.trim());
  return match ? match[1]! : xml;
}

/**
 * Makes every `id` of a fragment unique by prefixing it, and rewrites the
 * references (`url(#id)`, `href="#id"`). On web all inline SVGs share one id
 * namespace, so two documents defining `clipPath id="shell"` would collide.
 */
export function prefixSvgIds(fragment: string, prefix: string): string {
  if (!prefix) return fragment;
  return fragment
    .replace(/\bid=(["'])([^"']+)\1/g, (_m, q: string, id: string) => `id=${q}${prefix}${id}${q}`)
    .replace(/url\(\s*#([^)\s]+)\s*\)/g, (_m, id: string) => `url(#${prefix}${id})`)
    .replace(/\b((?:xlink:)?href)=(["'])#([^"']+)\2/g, (_m, attr: string, q: string, id: string) => `${attr}=${q}#${prefix}${id}${q}`);
}

/** `useId()` output is not a valid XML id (`:r1:`, `«r1»`, `_r_1_`). */
export function sanitizeId(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, '');
}

const n = (value: number) => +value.toFixed(3);

/**
 * Wraps portrait artwork (in a `size` coordinate space) into a document for
 * the given orientation. Landscape rotates it a quarter turn counter-clockwise:
 * portrait `(x, y)` lands at `(y, size.width - x)`, so the top of the device
 * goes left. Same mapping as `rotatedScreenOffset`.
 */
export function orientDocument(content: string, size: Size, orientation: Orientation): string {
  const { width, height } = size;
  if (orientation === 'portrait') {
    return `<svg viewBox="0 0 ${n(width)} ${n(height)}">${content}</svg>`;
  }
  return `<svg viewBox="0 0 ${n(height)} ${n(width)}"><g transform="translate(0 ${n(width)}) rotate(-90)">${content}</g></svg>`;
}

export interface CornerRadii {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

/** Rounded rectangle path data, clockwise. */
export function roundedRectPath(x: number, y: number, width: number, height: number, radius: number | CornerRadii): string {
  const max = Math.min(width, height) / 2;
  const r = typeof radius === 'number' ? { topLeft: radius, topRight: radius, bottomRight: radius, bottomLeft: radius } : radius;
  const tl = Math.max(0, Math.min(r.topLeft, max));
  const tr = Math.max(0, Math.min(r.topRight, max));
  const br = Math.max(0, Math.min(r.bottomRight, max));
  const bl = Math.max(0, Math.min(r.bottomLeft, max));
  const right = x + width;
  const bottom = y + height;
  const arc = (rad: number, toX: number, toY: number) => (rad > 0 ? ` A ${n(rad)},${n(rad)} 0 0 1 ${n(toX)},${n(toY)}` : '');
  return (
    `M ${n(x + tl)},${n(y)} H ${n(right - tr)}` +
    arc(tr, right, y + tr) +
    ` V ${n(bottom - br)}` +
    arc(br, right - br, bottom) +
    ` H ${n(x + bl)}` +
    arc(bl, x, bottom - bl) +
    ` V ${n(y + tl)}` +
    arc(tl, x + tl, y) +
    ' Z'
  );
}

const PARAMS: Record<string, number> = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };

/**
 * Every point of the first subpath of a path (end points and control points),
 * in absolute coordinates.
 */
export function outlinePoints(d: string): { x: number; y: number }[] {
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const points: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;
  let command = '';
  let subpaths = 0;
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i]!;
    if (/^[a-z]$/i.test(token)) {
      command = token;
      i += 1;
      if (command.toUpperCase() === 'M') {
        subpaths += 1;
        if (subpaths > 1) break;
      }
      if (command.toUpperCase() === 'Z') continue;
    }
    const upper = command.toUpperCase();
    const count = PARAMS[upper];
    if (!count) {
      i += 1;
      continue;
    }
    const args = tokens.slice(i, i + count).map(Number);
    if (args.length < count || args.some(Number.isNaN)) break;
    i += count;
    const relative = command !== upper;
    const ox = relative ? cx : 0;
    const oy = relative ? cy : 0;
    if (upper === 'H') {
      cx = ox + args[0]!;
    } else if (upper === 'V') {
      cy = oy + args[0]!;
    } else if (upper === 'A') {
      cx = ox + args[5]!;
      cy = oy + args[6]!;
    } else {
      for (let k = 0; k < count - 2; k += 2) points.push({ x: ox + args[k]!, y: oy + args[k + 1]! });
      cx = ox + args[count - 2]!;
      cy = oy + args[count - 1]!;
    }
    points.push({ x: cx, y: cy });
    // Implicit repeats of M are L.
    if (upper === 'M') command = relative ? 'l' : 'L';
  }
  return points;
}

/**
 * Corner radii of a rounded rectangle that contains the visible screen shape
 * (so the bezel mask can cover the difference) while staying well inside the
 * device body. Per corner: how far along the edges the outline starts curving,
 * shrunk to stay inside continuous-curvature ("squircle") corners.
 */
export function screenClipRadii(screenPath: string | undefined, size: Size): CornerRadii {
  const zero = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
  if (!screenPath) return zero;
  const points = outlinePoints(screenPath);
  if (!points.length) return zero;
  const { width, height } = size;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.5;
  const extent = (xs: number[], fallback: number) => (xs.length ? Math.min(...xs) : fallback);
  const corner = (cornerX: number, cornerY: number) => {
    const alongX = extent(points.filter((p) => near(p.y, cornerY)).map((p) => Math.abs(p.x - cornerX)), 0);
    const alongY = extent(points.filter((p) => near(p.x, cornerX)).map((p) => Math.abs(p.y - cornerY)), 0);
    return n(Math.min(alongX, alongY) * 0.8);
  };
  return {
    topLeft: corner(0, 0),
    topRight: corner(width, 0),
    bottomRight: corner(width, height),
    bottomLeft: corner(0, height),
  };
}

/**
 * Corner radii after a quarter turn counter-clockwise: the portrait top-left
 * corner ends up bottom-left, and so on.
 */
export function rotateRadii(radii: CornerRadii, orientation: 'portrait' | 'landscape'): CornerRadii {
  if (orientation === 'portrait') return radii;
  return {
    topLeft: radii.topRight,
    topRight: radii.bottomRight,
    bottomRight: radii.bottomLeft,
    bottomLeft: radii.topLeft,
  };
}

/**
 * Best guess of the outer corner radius of a body drawing, used to shape the
 * drop shadow. Looks at near-full-size `<rect rx>` and at the first arc of
 * near-full-size paths.
 */
export function estimateBodyCornerRadius(body: string | undefined, size: Size): number {
  const fallback = Math.min(size.width, size.height) * 0.08;
  if (!body) return fallback;
  let best = 0;
  for (const match of body.matchAll(/<rect\b([^>]*)>/gi)) {
    const attrs = match[1]!;
    const width = Number(/\bwidth="([-\d.]+)"/.exec(attrs)?.[1]);
    const rx = Number(/\brx="([-\d.]+)"/.exec(attrs)?.[1]);
    if (width >= size.width * 0.8 && rx > best) best = rx;
  }
  for (const match of body.matchAll(/<path\b[^>]*\bd="([^"]+)"/gi)) {
    const d = match[1]!;
    const arc = /A\s*([\d.]+)[ ,]/.exec(d);
    const xs = [...d.matchAll(/[MLH]\s*(-?[\d.]+)/g)].map((m) => Number(m[1]));
    const spread = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
    if (arc && spread >= size.width * 0.7) best = Math.max(best, Number(arc[1]));
  }
  return best > 0 ? best : fallback;
}
