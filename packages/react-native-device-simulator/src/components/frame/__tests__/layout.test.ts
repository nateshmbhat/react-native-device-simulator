import { rotatedScreenOffset } from '../../../core/geometry';
import { presetFromCustomDevice, defaultCustomDevice } from '../../../presets';
import { galaxyS25, galaxyZFold8, iPhone17e, iPhone17Pro, iPhoneSE3rdGen, largeDesktopWindow, pixel10 } from '../../../presets/generated';
import type { DevicePreset } from '../../../types';
import { frameBodyDocument, frameMaskDocument } from '../documents';
import { getDeviceOuterSize, isLightColor } from '../DeviceFrame';
import { computeFrameLayout, genericFrame, orientFeatureBounds, resolveFrame } from '../layout';
import {
  estimateBodyCornerRadius,
  orientDocument,
  outlinePoints,
  prefixSvgIds,
  rotateRadii,
  roundedRectPath,
  screenClipRadii,
  svgContent,
  svgNaturalSize,
} from '../svg';

const landscape = (p: DevicePreset) => ({ width: p.portraitSize.height, height: p.portraitSize.width });

describe('getDeviceOuterSize', () => {
  it('is the frame body size for a framed preset in portrait', () => {
    expect(getDeviceOuterSize(iPhone17Pro, 'portrait', iPhone17Pro.portraitSize, true)).toEqual(iPhone17Pro.frame!.size);
  });

  it('swaps the body size in landscape', () => {
    expect(getDeviceOuterSize(iPhone17Pro, 'landscape', landscape(iPhone17Pro), true)).toEqual({
      width: iPhone17Pro.frame!.size.height,
      height: iPhone17Pro.frame!.size.width,
    });
  });

  it('is exactly the screen when the frame is hidden', () => {
    expect(getDeviceOuterSize(iPhone17Pro, 'portrait', iPhone17Pro.portraitSize, false)).toEqual(iPhone17Pro.portraitSize);
    expect(getDeviceOuterSize(iPhone17Pro, 'landscape', { width: 874, height: 402 }, false)).toEqual({ width: 874, height: 402 });
    // Not simulating: DevicePreview passes the stage size.
    expect(getDeviceOuterSize(iPhone17Pro, 'portrait', { width: 1234, height: 567 }, false)).toEqual({ width: 1234, height: 567 });
  });

  it('draws a generic frame around presets without artwork', () => {
    const custom = presetFromCustomDevice(defaultCustomDevice);
    const portrait = getDeviceOuterSize(custom, 'portrait', custom.portraitSize, true);
    expect(portrait.width).toBeGreaterThan(custom.portraitSize.width);
    expect(portrait.height).toBeGreaterThan(custom.portraitSize.height);
    expect(getDeviceOuterSize(custom, 'landscape', landscape(custom), true)).toEqual({ width: portrait.height, height: portrait.width });
  });

  it('keeps desktop windows upright in landscape', () => {
    const layout = computeFrameLayout(largeDesktopWindow, 'landscape', { width: 1080, height: 1920 }, true);
    expect(layout.frameOrientation).toBe('portrait');
    expect(layout.outer).toEqual({ width: 1082, height: 1949 });
    expect(layout.screen).toEqual({ x: 1, y: 28, width: 1080, height: 1920 });
  });

  it('uses a generic frame when the screen does not match the artwork', () => {
    const outer = getDeviceOuterSize(largeDesktopWindow, 'portrait', { width: 800, height: 600 }, true);
    expect(outer).toEqual({ width: 802, height: 629 });
  });
});

describe('computeFrameLayout', () => {
  it('places the screen at the frame offset in portrait', () => {
    const layout = computeFrameLayout(pixel10, 'portrait', pixel10.portraitSize, true);
    expect(layout.screen).toEqual({ x: 22.48, y: 20.19, ...pixel10.portraitSize });
  });

  it('rotates the screen offset counter-clockwise in landscape', () => {
    const frame = galaxyZFold8.frame!;
    const layout = computeFrameLayout(galaxyZFold8, 'landscape', landscape(galaxyZFold8), true);
    expect(layout.screen).toEqual({
      ...rotatedScreenOffset(frame.size, frame.screenOffset, galaxyZFold8.portraitSize),
      ...landscape(galaxyZFold8),
    });
    expect(layout.portraitScreen).toEqual(galaxyZFold8.portraitSize);
  });

  it('keeps the screen inside the body for every kind of generic frame', () => {
    for (const kind of ['phone', 'tablet', 'foldable', 'desktop'] as const) {
      for (const platform of ['ios', 'android', 'macos', 'windows'] as const) {
        const screen = kind === 'desktop' ? { width: 1280, height: 800 } : kind === 'phone' ? { width: 390, height: 844 } : { width: 820, height: 1180 };
        const frame = genericFrame({ kind, platform }, screen);
        expect(frame.screenOffset.x).toBeGreaterThanOrEqual(0);
        expect(frame.screenOffset.x + screen.width).toBeLessThanOrEqual(frame.size.width);
        expect(frame.screenOffset.y + screen.height).toBeLessThanOrEqual(frame.size.height);
        expect(svgNaturalSize(frame.body!)).toEqual(frame.size);
      }
    }
  });

  it('prefers the preset artwork when it matches the screen', () => {
    expect(resolveFrame(iPhone17Pro, iPhone17Pro.portraitSize)).toBe(iPhone17Pro.frame);
  });

  it('estimates the body corner radius for the shadow', () => {
    expect(estimateBodyCornerRadius(iPhone17Pro.frame!.body, iPhone17Pro.frame!.size)).toBe(79);
    expect(estimateBodyCornerRadius(galaxyS25.frame!.body, galaxyS25.frame!.size)).toBe(28);
  });
});

describe('frame documents', () => {
  it('reads the natural size of artwork', () => {
    expect(svgNaturalSize('<svg viewBox="0 0 30.75 11.62"><g/></svg>')).toEqual({ width: 30.75, height: 11.62 });
    expect(svgNaturalSize('<svg width="10" height="4"></svg>')).toEqual({ width: 10, height: 4 });
    expect(svgNaturalSize('nope')).toBeNull();
  });

  it('namespaces ids and their references', () => {
    const out = prefixSvgIds('<clipPath id="shell"/><g clip-path="url(#shell)"/><use href="#shell"/>', 'p');
    expect(out).toBe('<clipPath id="pshell"/><g clip-path="url(#pshell)"/><use href="#pshell"/>');
  });

  it('rotates landscape documents a quarter turn counter-clockwise', () => {
    expect(orientDocument('<g/>', { width: 10, height: 20 }, 'landscape')).toBe(
      '<svg viewBox="0 0 20 10"><g transform="translate(0 10) rotate(-90)"><g/></g></svg>',
    );
    expect(orientDocument('<g/>', { width: 10, height: 20 }, 'portrait')).toBe('<svg viewBox="0 0 10 20"><g/></svg>');
  });

  it('builds a body document with unique ids', () => {
    const xml = frameBodyDocument(galaxyS25.frame!, 'portrait', 'x')!;
    expect(xml).toContain('id="xshell"');
    expect(xml).not.toContain('url(#shell)');
    expect(svgContent(xml)).not.toContain('<svg');
  });

  it('cuts the screen outline out of the app area with a non-zero mask', () => {
    const radii = screenClipRadii(iPhone17Pro.frame!.screenPath, iPhone17Pro.portraitSize);
    const xml = frameMaskDocument(iPhone17Pro.frame!, iPhone17Pro.portraitSize, radii, 'portrait', 'm')!;
    expect(xml).toContain('<mask id="mscreen-mask" maskUnits="userSpaceOnUse"');
    expect(xml).toContain(`<path d="${iPhone17Pro.frame!.screenPath}" fill="#000000"/>`);
    expect(xml).toContain(`<path d="${roundedRectPath(0, 0, 402, 874, radii)}" fill="#000000"/>`);
    expect(xml).toContain('mask="url(#mscreen-mask)"');
    // Even-odd would cancel out outlines traced twice (e.g. the iPad mini spec).
    expect(xml).not.toContain('evenodd');
    expect(xml).toContain('translate(17 17)');
    const plain = { ...iPhone17Pro.frame!, screenPath: undefined };
    expect(frameMaskDocument(plain, iPhone17Pro.portraitSize, radii, 'portrait', 'm')).toBeNull();
  });
});

describe('screen clip radii', () => {
  it('reads the points of the outer outline only', () => {
    expect(outlinePoints('M 1,2 H 5 V 6 l -1,1 Z M 100,100 L 0,0')).toEqual([
      { x: 1, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 6 },
      { x: 4, y: 7 },
    ]);
  });

  it('stays inside circular screen corners', () => {
    const radii = screenClipRadii(pixel10.frame!.screenPath, pixel10.portraitSize);
    expect(radii.topLeft).toBeCloseTo(33.14 * 0.8, 2);
    expect(radii.bottomRight).toBeCloseTo(33.14 * 0.8, 2);
  });

  it('handles continuous-curvature corners, notches and square corners', () => {
    const pro = screenClipRadii(iPhone17Pro.frame!.screenPath, iPhone17Pro.portraitSize);
    expect(pro.topLeft).toBeGreaterThan(40);
    expect(pro.topLeft).toBeLessThan(60);
    const notch = screenClipRadii(iPhone17e.frame!.screenPath, iPhone17e.portraitSize);
    expect(notch.topRight).toBeCloseTo(notch.topLeft, 1);
    expect(screenClipRadii(iPhoneSE3rdGen.frame!.screenPath, iPhoneSE3rdGen.portraitSize).topLeft).toBe(0);
    const desktop = screenClipRadii(largeDesktopWindow.frame!.screenPath, largeDesktopWindow.portraitSize);
    expect(desktop).toEqual({ topLeft: 0, topRight: 0, bottomRight: 9.6, bottomLeft: 9.6 });
  });

  it('rotates corners with the device', () => {
    const r = { topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 };
    expect(rotateRadii(r, 'landscape')).toEqual({ topLeft: 2, topRight: 3, bottomRight: 4, bottomLeft: 1 });
  });
});

describe('display features', () => {
  it('rotates fold bounds with the device', () => {
    const fold = galaxyZFold8.displayFeatures![0]!;
    expect(orientFeatureBounds(fold, galaxyZFold8.portraitSize, 'portrait')).toEqual({ x: 0, y: 489.5, width: 731, height: 0 });
    expect(orientFeatureBounds(fold, galaxyZFold8.portraitSize, 'landscape')).toEqual({ x: 489.5, y: 0, width: 0, height: 731 });
  });
});

describe('isLightColor', () => {
  it('classifies system UI tints', () => {
    expect(isLightColor('#ffffff')).toBe(true);
    expect(isLightColor('#fff')).toBe(true);
    expect(isLightColor('white')).toBe(true);
    expect(isLightColor('rgba(255, 255, 255, 0.9)')).toBe(true);
    expect(isLightColor('#000000')).toBe(false);
    expect(isLightColor('rgb(20, 20, 20)')).toBe(false);
  });
});
