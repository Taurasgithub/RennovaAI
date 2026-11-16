import { useCallback, useEffect, useRef, type ComponentRef, type RefObject } from 'react';
import { Keyboard, TextInput, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

/**
 * Keyboard handling shared by every screen with text fields.
 *
 * Android apps are edge-to-edge, so the window no longer shrinks for the keyboard: a
 * KeyboardAvoidingView needs `behavior="padding"` on both platforms (Expo keyboard-handling guide).
 * That only shrinks the screen, though. A field near the bottom of a ScrollView can still sit under
 * the keyboard or a footer button, so `useKeepFocusedInputVisible` scrolls it into view.
 */
export const KEYBOARD_BEHAVIOR = 'padding' as const;

/** What `useRef` holds for a ScrollView. */
export type ScrollViewRef = ComponentRef<typeof ScrollView>;

/** Space kept between the focused field and whatever covers the bottom of the scroll area. */
const GAP = 24;

export function useKeepFocusedInputVisible(scrollRef: RefObject<ScrollViewRef | null>) {
  const offset = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      // Let KeyboardAvoidingView apply its padding first, so the visible area is final.
      clearTimeout(timer);
      timer = setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput();
        const scroll = scrollRef.current;
        if (!input || !scroll) return;
        scroll.measureInWindow((_sx, sy, _sw, sh) => {
          input.measureInWindow((_ix, iy, _iw, ih) => {
            // Only the screen that contains the field reacts (screens kept mounted in the background measure as empty or elsewhere).
            if (sh <= 0 || iy < sy) return;
            const hidden = iy + ih + GAP - (sy + sh);
            if (hidden > 0) scroll.scrollTo({ y: offset.current + hidden, animated: true });
          });
        });
      }, 120);
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [scrollRef]);

  return { onScroll, scrollEventThrottle: 16 } as const;
}
