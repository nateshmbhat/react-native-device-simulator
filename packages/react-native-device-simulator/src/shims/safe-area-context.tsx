/**
 * Preview-aware `react-native-safe-area-context`. The Metro helper
 * (`react-native-device-simulator/metro`) points every import of
 * `react-native-safe-area-context` here, except the import below.
 *
 * Inside an active preview screen:
 * - `SafeAreaProvider` keeps providing the simulated insets and frame, so a
 *   provider nested in the app (Expo Router, React Navigation, the app's root)
 *   does not replace them with the host's real insets.
 * - `SafeAreaView` applies the simulated insets as padding / margin, honouring
 *   `edges` and `mode` like the library's web implementation.
 * - `SafeAreaListener` reports the simulated insets and frame.
 *
 * Outside a preview everything behaves like the original. Each component
 * renders the same element types in both cases, so turning the preview on or
 * off never remounts the app.
 */
import * as React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as Real from 'react-native-safe-area-context';
import type { EdgeInsets, Edge, EdgeRecord, Rect, SafeAreaViewProps } from 'react-native-safe-area-context';
import { usePreviewScreen } from '../previewScreenContext';

export * from 'react-native-safe-area-context';

const { SafeAreaInsetsContext, SafeAreaFrameContext } = Real;

type EdgeMode = 'off' | 'additive' | 'maximum';
type Simulated = { insets: EdgeInsets; frame: Rect } | null;

/** The simulated safe area when rendered inside an active preview screen. */
function useSimulatedSafeArea(): Simulated {
  const preview = usePreviewScreen();
  const insets = React.useContext(SafeAreaInsetsContext);
  const frame = React.useContext(SafeAreaFrameContext);
  return preview && insets && frame ? { insets, frame } : null;
}

function SimulatedSafeAreaContexts({ value, children }: { value: Simulated; children?: React.ReactNode }) {
  const insets = React.useContext(SafeAreaInsetsContext);
  const frame = React.useContext(SafeAreaFrameContext);
  return (
    <SafeAreaFrameContext.Provider value={value?.frame ?? frame}>
      <SafeAreaInsetsContext.Provider value={value?.insets ?? insets}>{children}</SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

export function SafeAreaProvider({ children, initialMetrics, ...props }: Real.SafeAreaProviderProps) {
  const simulated = useSimulatedSafeArea();
  return (
    <Real.SafeAreaProvider {...props} initialMetrics={simulated ?? initialMetrics}>
      <SimulatedSafeAreaContexts value={simulated}>{children}</SimulatedSafeAreaContexts>
    </Real.SafeAreaProvider>
  );
}

const DEFAULT_EDGES: Record<Edge, EdgeMode> = { top: 'additive', right: 'additive', bottom: 'additive', left: 'additive' };
const NO_EDGES: Record<Edge, EdgeMode> = { top: 'off', right: 'off', bottom: 'off', left: 'off' };

function edgeRecord(edges: SafeAreaViewProps['edges']): EdgeRecord {
  if (edges == null) return DEFAULT_EDGES;
  if (Array.isArray(edges)) {
    const record: EdgeRecord = {};
    (edges as readonly Edge[]).forEach((edge) => (record[edge] = 'additive'));
    return record;
  }
  return edges as EdgeRecord;
}

function edgeValue(inset: number, current: number, mode: EdgeMode | undefined): number {
  switch (mode) {
    case 'maximum':
      return Math.max(current, inset);
    case 'additive':
      return current + inset;
    default:
      return current;
  }
}

/**
 * The style `SafeAreaView` gets for `insets`: the same maths as
 * react-native-safe-area-context's web implementation.
 */
export function safeAreaViewStyle(
  style: SafeAreaViewProps['style'],
  insets: EdgeInsets,
  mode: SafeAreaViewProps['mode'],
  edges: SafeAreaViewProps['edges'],
): StyleProp<ViewStyle> {
  const record = edgeRecord(edges);
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, number>;
  if (mode === 'margin') {
    const {
      margin = 0,
      marginVertical = margin,
      marginHorizontal = margin,
      marginTop = marginVertical,
      marginRight = marginHorizontal,
      marginBottom = marginVertical,
      marginLeft = marginHorizontal,
    } = flat;
    return [
      style,
      {
        marginTop: edgeValue(insets.top, marginTop, record.top),
        marginRight: edgeValue(insets.right, marginRight, record.right),
        marginBottom: edgeValue(insets.bottom, marginBottom, record.bottom),
        marginLeft: edgeValue(insets.left, marginLeft, record.left),
      },
    ];
  }
  const {
    padding = 0,
    paddingVertical = padding,
    paddingHorizontal = padding,
    paddingTop = paddingVertical,
    paddingRight = paddingHorizontal,
    paddingBottom = paddingVertical,
    paddingLeft = paddingHorizontal,
  } = flat;
  return [
    style,
    {
      paddingTop: edgeValue(insets.top, paddingTop, record.top),
      paddingRight: edgeValue(insets.right, paddingRight, record.right),
      paddingBottom: edgeValue(insets.bottom, paddingBottom, record.bottom),
      paddingLeft: edgeValue(insets.left, paddingLeft, record.left),
    },
  ];
}

type SafeAreaViewShimProps = SafeAreaViewProps;

// forwardRef (not ref-as-prop) so refs also work on React 18.
export const SafeAreaView = React.forwardRef<unknown, SafeAreaViewShimProps>(function SafeAreaView(
  { style, mode, edges, ...rest },
  ref,
) {
  const simulated = useSimulatedSafeArea();
  const RealView = Real.SafeAreaView as unknown as React.ComponentType<SafeAreaViewShimProps & { ref?: React.Ref<unknown> }>;
  if (!simulated) return <RealView {...rest} ref={ref} style={style} mode={mode} edges={edges} />;
  // Same component in both cases (no remount): with every edge off the real
  // view adds no insets of its own and only the simulated ones apply.
  return (
    <RealView {...rest} ref={ref} mode={mode} edges={NO_EDGES} style={safeAreaViewStyle(style, simulated.insets, mode, edges)} />
  );
});

export function SafeAreaListener({ onChange, ...props }: Real.SafeAreaListenerProps) {
  const simulated = useSimulatedSafeArea();
  const insets = simulated?.insets;
  const frame = simulated?.frame;
  const latest = React.useRef(onChange);
  React.useEffect(() => {
    latest.current = onChange;
  });
  React.useEffect(() => {
    if (insets && frame) latest.current({ insets, frame });
  }, [insets, frame]);
  return (
    <Real.SafeAreaListener
      {...props}
      onChange={(data) => {
        // Native (host) measurements do not describe the simulated screen.
        if (!simulated) onChange(data);
      }}
    />
  );
}
