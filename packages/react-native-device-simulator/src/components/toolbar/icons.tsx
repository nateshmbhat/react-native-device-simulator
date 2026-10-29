import * as React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Small stroke icons drawn with react-native-svg (24x24 grid, 1.75 stroke), so
 * the library needs no icon font.
 */

/** A gear outline with `teeth` rounded teeth, centred in the 24x24 grid. */
function gearPath(teeth = 8, outer = 10, inner = 7.4): string {
  const step = (Math.PI * 2) / teeth;
  const toothHalf = step * 0.2;
  const rootHalf = step * 0.3;
  const pt = (r: number, a: number) => `${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${pt(inner, a - rootHalf)} L${pt(outer, a - toothHalf)} L${pt(outer, a + toothHalf)} L${pt(inner, a + rootHalf)} `;
  }
  return `${d}Z`;
}

const GEAR = gearPath();

type Draw = (color: string) => React.ReactNode;

const icons = {
  phone: () => (
    <>
      <Rect x={6} y={2} width={12} height={20} rx={2.5} />
      <Path d="M11 18.5h2" />
    </>
  ),
  tablet: () => (
    <>
      <Rect x={4} y={2.5} width={16} height={19} rx={2.5} />
      <Path d="M11 18.5h2" />
    </>
  ),
  desktop: () => (
    <>
      <Rect x={2.5} y={3.5} width={19} height={13} rx={2} />
      <Path d="M8 20.5h8M12 16.5v4" />
    </>
  ),
  foldable: () => (
    <>
      <Rect x={3} y={4} width={18} height={16} rx={2.5} />
      <Path d="M12 4v16" strokeDasharray="2 2.2" />
    </>
  ),
  rotate: () => (
    <>
      <Path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <Path d="M20.5 3.5v5h-5" />
    </>
  ),
  frame: () => (
    <>
      <Rect x={5} y={1.75} width={14} height={20.5} rx={3.5} />
      <Rect x={7.5} y={4.5} width={9} height={15} rx={1.2} />
    </>
  ),
  statusBar: () => (
    <>
      <Rect x={5} y={2} width={14} height={20} rx={2.5} />
      <Path d="M8 5.5h3M14.5 5.5h1.5" />
    </>
  ),
  keyboard: () => (
    <>
      <Rect x={2} y={5.5} width={20} height={13} rx={2} />
      <Path d="M6 9.5h.01M10 9.5h.01M14 9.5h.01M18 9.5h.01M6 12.5h.01M18 12.5h.01M8 15h8" />
    </>
  ),
  sun: () => (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: () => <Path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.6 6.6 0 0 0 10.7 10.7z" />,
  display: (color) => (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 3a9 9 0 0 1 0 18z" fill={color} />
    </>
  ),
  textSize: () => <Path d="M3.5 7V5h10v2M8.5 5v14M6.5 19h4M14 12v-1.5h6.5V12M17.25 10.5V19M15.75 19h3" />,
  globe: () => (
    <>
      <Circle cx={12} cy={12} r={9.25} />
      <Path d="M2.75 12h18.5M12 2.75c2.4 2.5 3.6 5.6 3.6 9.25S14.4 18.75 12 21.25C9.6 18.75 8.4 15.65 8.4 12S9.6 5.25 12 2.75z" />
    </>
  ),
  clock: () => (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3.2 2" />
    </>
  ),
  accessibility: (color) => (
    <>
      <Circle cx={12} cy={4.5} r={1.9} fill={color} stroke="none" />
      <Path d="M4.5 8.5 12 10l7.5-1.5M12 10v4.5M12 14.5l-3.2 6.5M12 14.5l3.2 6.5" />
    </>
  ),
  settings: () => (
    <>
      <Path d={GEAR} />
      <Circle cx={12} cy={12} r={2.8} />
    </>
  ),
  search: () => (
    <>
      <Circle cx={10.75} cy={10.75} r={6.75} />
      <Path d="m20 20-4.5-4.5" />
    </>
  ),
  chevronRight: () => <Path d="m9 5.5 6.5 6.5L9 18.5" />,
  chevronLeft: () => <Path d="M15 5.5 8.5 12l6.5 6.5" />,
  chevronDown: () => <Path d="m5.5 9 6.5 6.5L18.5 9" />,
  chevronUp: () => <Path d="M5.5 15 12 8.5l6.5 6.5" />,
  close: () => <Path d="M6 6l12 12M18 6 6 18" />,
  eye: () => (
    <>
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
  eyeOff: () => (
    <>
      <Path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.5M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
      <Path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  check: () => <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  power: () => (
    <>
      <Path d="M12 2.5v8.5" />
      <Path d="M17.8 6.2a8.5 8.5 0 1 1-11.6 0" />
    </>
  ),
  panelRight: () => (
    <>
      <Rect x={3} y={3.5} width={18} height={17} rx={2.5} />
      <Path d="M15 3.5v17" />
    </>
  ),
  panelLeft: () => (
    <>
      <Rect x={3} y={3.5} width={18} height={17} rx={2.5} />
      <Path d="M9 3.5v17" />
    </>
  ),
  panelBottom: () => (
    <>
      <Rect x={3} y={3.5} width={18} height={17} rx={2.5} />
      <Path d="M3 15h18" />
    </>
  ),
  reset: () => (
    <>
      <Path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <Path d="M3.5 3.5v5h5" />
    </>
  ),
  plus: () => <Path d="M12 5v14M5 12h14" />,
  minus: () => <Path d="M5 12h14" />,
  apps: () => (
    <>
      <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} />
      <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} />
      <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} />
      <Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.5} />
    </>
  ),
  edit: () => <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />,
} satisfies Record<string, Draw>;

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export const Icon = React.memo(function Icon({ name, size = 16, color, strokeWidth = 1.75 }: IconProps) {
  const draw: Draw = icons[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
    >
      {draw(color)}
    </Svg>
  );
});

/** Icon for a device kind. */
export function kindIcon(kind: string): IconName {
  switch (kind) {
    case 'tablet':
      return 'tablet';
    case 'foldable':
      return 'foldable';
    case 'desktop':
      return 'desktop';
    default:
      return 'phone';
  }
}
