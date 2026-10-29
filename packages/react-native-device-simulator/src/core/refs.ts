import { createRef, type ComponentRef, type RefObject } from 'react';
import type { View } from 'react-native';

export type ViewHandle = ComponentRef<typeof View>;

/** The whole device (frame included), as currently drawn. Used for screenshots. */
export const deviceViewRef: RefObject<ViewHandle | null> = createRef<ViewHandle>();
/** The simulated screen only (the app, no frame). */
export const screenViewRef: RefObject<ViewHandle | null> = createRef<ViewHandle>();
