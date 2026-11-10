// src/components/splash/AnimatedSplash.tsx
//
// Launch screen shown on top of the app while auth is restored: the app icon on navy, breathing
// gently, then a quick fade. It continues the native splash (app.json → expo-splash-screen), which
// draws the same icon at the same size on the same color.
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const NAVY = "#1B254B"; // must match the native splash backgroundColor in app.json

// Clipping the 150pt image (same size as the native splash) to 140pt trims the icon's white margin.
const ICON_IMAGE_SIZE = 150;
const BADGE_SIZE = 140;
const BADGE_RADIUS = 30;

/** Just enough for one pulse to read; a fast launch is never held up longer than this. */
const MIN_VISIBLE_MS = 600;
/** Lets the router land on login/home underneath before the fade reveals it. */
const EXIT_DELAY_MS = 120;
const EXIT_DURATION_MS = 250;

type AnimatedSplashProps = {
  /** True once the app can be shown (auth restored). */
  isAppReady: boolean;
  /** Called after the fade; the parent should unmount the splash. */
  onFinish: () => void;
};

export function AnimatedSplash({ isAppReady, onFinish }: AnimatedSplashProps) {
  const [minTimeDone, setMinTimeDone] = useState(false);
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    pulse.set(withRepeat(withTiming(1.05, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true));
    const timer = setTimeout(() => setMinTimeDone(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [pulse]);

  useEffect(() => {
    if (!isAppReady || !minTimeDone) return;
    opacity.set(
      withDelay(
        EXIT_DELAY_MS,
        withTiming(0, { duration: EXIT_DURATION_MS }, (finished) => {
          if (finished) scheduleOnRN(onFinish);
        }),
      ),
    );
  }, [isAppReady, minTimeDone, opacity, onFinish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  return (
    // Hide the native splash only once this overlay has laid out, so no blank frame shows in between.
    <Animated.View style={[styles.root, rootStyle]} onLayout={() => SplashScreen.hide()}>
      <Animated.View style={[styles.badge, badgeStyle]}>
        <View style={styles.clip}>
          <Image source={require("@/assets/images/icon.png")} style={styles.image} contentFit="cover" />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NAVY,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
  clip: {
    flex: 1,
    borderRadius: BADGE_RADIUS,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  image: {
    position: "absolute",
    width: ICON_IMAGE_SIZE,
    height: ICON_IMAGE_SIZE,
    left: (BADGE_SIZE - ICON_IMAGE_SIZE) / 2,
    top: (BADGE_SIZE - ICON_IMAGE_SIZE) / 2,
  },
});
