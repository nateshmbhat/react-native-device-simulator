import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEventName } from 'react-native';

export interface KeyboardLogEntry {
  id: number;
  event: KeyboardEventName;
  height: number;
  time: string;
}

const EVENTS: KeyboardEventName[] = ['keyboardWillShow', 'keyboardDidShow', 'keyboardWillHide', 'keyboardDidHide'];

let nextId = 0;

/** Keyboard visibility, height and a log of the latest `Keyboard` events. */
export function useKeyboard(limit = 8) {
  const [height, setHeight] = useState(0);
  const [log, setLog] = useState<KeyboardLogEntry[]>([]);

  useEffect(() => {
    const subscriptions = EVENTS.map((event) =>
      Keyboard.addListener(event, (e) => {
        const h = e?.endCoordinates?.height ?? 0;
        if (event === 'keyboardDidShow' || event === 'keyboardWillShow') setHeight(h);
        if (event === 'keyboardDidHide' || event === 'keyboardWillHide') setHeight(0);
        const time = new Date().toLocaleTimeString(undefined, { hour12: false });
        setLog((current) => [{ id: nextId++, event, height: h, time }, ...current].slice(0, limit));
      }),
    );
    return () => subscriptions.forEach((s) => s.remove());
  }, [limit]);

  return { visible: height > 0, height, log };
}
