/**
 * Builds the two SVG documents of a framed device, both covering the whole
 * body in the current orientation:
 *
 * - the **body**, drawn behind the screen;
 * - the **mask**, drawn over the app: the bezel parts that cover the screen
 *   rectangle (rounded corners, Dynamic Island, notch, camera hole).
 */
import type { DeviceFrameSpec, Orientation, Size } from '../../types';
import { orientDocument, prefixSvgIds, roundedRectPath, svgContent, type CornerRadii } from './svg';

/** How far (logical px) the mask's body copy extends past the screen rectangle. */
const MASK_BLEED = 2;

export function frameBodyDocument(frame: DeviceFrameSpec, orientation: Orientation, idPrefix: string): string | null {
  if (!frame.body) return null;
  return orientDocument(prefixSvgIds(svgContent(frame.body), idPrefix), frame.size, orientation);
}

/**
 * What the app view covers outside the visible screen: the screen rectangle
 * minus the screen outline (corners, Dynamic Island, notch, camera hole).
 *
 * The outline is cut out with an SVG `<mask>` filled with the default
 * non-zero rule, which is how the specs are meant to be read (an island is a
 * counter-clockwise subpath; some outlines are drawn in either direction or
 * trace the edge more than once, which an even-odd rule would get wrong).
 *
 * The area is painted black, then with the body artwork, so the corners match
 * the bezel exactly even when it is not black (desktop windows). The black
 * fill stays inside `clipRadii`, the rounded rectangle the app view itself is
 * clipped to, so nothing ever shows outside the device.
 *
 * Returns null when the screen is a plain rectangle (nothing to hide).
 */
export function frameMaskDocument(
  frame: DeviceFrameSpec,
  portraitScreen: Size,
  /** Corners the app view is clipped to (portrait). The black fill stays inside them. */
  clipRadii: CornerRadii,
  orientation: Orientation,
  idPrefix: string,
): string | null {
  if (!frame.screenPath) return null;
  const { x, y } = frame.screenOffset;
  const { width, height } = portraitScreen;
  // The body copy reaches a little past the screen rectangle: where the mask
  // edge would coincide with the app's edge, both would be antialiased and the
  // app would bleed through as a hairline. Past the edge it repaints the same
  // body pixels, so the overlap is invisible.
  const e = MASK_BLEED;
  const maskId = `${idPrefix}screen-mask`;
  const region = `x="${-e}" y="${-e}" width="${width + 2 * e}" height="${height + 2 * e}"`;
  const mask =
    `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" ${region}>` +
    `<rect ${region} fill="#ffffff"/>` +
    `<path d="${frame.screenPath}" fill="#000000"/>` +
    `</mask></defs>`;
  const black = `<path d="${roundedRectPath(0, 0, width, height, clipRadii)}" fill="#000000"/>`;
  const body = frame.body
    ? `<g transform="translate(${-x} ${-y})">${prefixSvgIds(svgContent(frame.body), idPrefix)}</g>`
    : '';
  const content = `<g transform="translate(${x} ${y})">${mask}<g mask="url(#${maskId})">${black}${body}</g></g>`;
  return orientDocument(content, frame.size, orientation);
}
