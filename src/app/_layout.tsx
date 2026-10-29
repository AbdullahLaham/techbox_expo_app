// import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
// import * as SplashScreen from 'expo-splash-screen';
// import { useColorScheme } from 'react-native';

// import { AnimatedSplashOverlay } from '@/components/animated-icon';
// import AppTabs from '@/components/app-tabs';
// import "../../global.css";

// SplashScreen.preventAutoHideAsync();

// export default function TabLayout() {
//   const colorScheme = useColorScheme();
//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <AnimatedSplashOverlay />
//       <AppTabs />
//     </ThemeProvider>
//   );
// }



// // src/app/_layout.tsx
// import "../../global.css"; // Ensure this path is correct relative to root

// import React, { useEffect, useState } from "react";
// import { View, ActivityIndicator, I18nManager } from "react-native";
// import { Stack, useRouter, useSegments } from "expo-router";
// import * as SecureStore from "expo-secure-store";
// import { authApi } from "@/api/auth";
// import { useAuthStore } from "@/store/useAuthStore";

// // 1. السماح وتفعيل اتجاه RTL
// if (!I18nManager.isRTL) {
//   I18nManager.allowRTL(true);
//   I18nManager.forceRTL(true);
// }
// export default function RootLayout() {


//   const router = useRouter();
//     const segments = useSegments();
    
//     const [isCheckingAuth, setIsCheckingAuth] = useState(true);
//     const { user, logout } = useAuthStore();
  
//     useEffect(() => {
//       const checkAuthWithMeEndpoint = async () => {
//         try {
//           // 1. قراءة الـ Token المحفوظ في جهاز المستخدم
//           const token = await SecureStore.getItemAsync("accessToken");
  
//           if (!token) {
//             // لا يوجد Token -> تحويل المجرى للتسجيل
//             await logout();
//             setIsCheckingAuth(false);
//             return;
//           }
  
//           // 2. التحقق الفعلي من صحة الـ Token باستدعاء GET /auth/me مباشرة
//           const userProfile = await authApi.getProfile();
  
//           // 3. التوكين صالح والبيانات صحيحة -> حفظ المستخدم في Zustand
//           useAuthStore.setState({
//             user: userProfile,
//             token: token,
//             isAuthenticated: true,
//           });
  
//         } catch (error) {
//           // 4. التوكين غير صالح أو منتهي الصلاحية (401 Unauthorized) -> مسح البيانات
//           console.log("فشل التحقق من الـ Token عبر /auth/me:", error);
//           await logout();
//         } finally {
//           setIsCheckingAuth(false);
//         }
//       };
  
//       checkAuthWithMeEndpoint();
//     }, []);
  
//     // توجيه التصفح تلقائياً فور الانتهاء من فحص الـ /me API
//     useEffect(() => {
//       if (isCheckingAuth) return;
  
//       const inAuthGroup = segments[0] === "(auth)";
//       const isAuthenticated = useAuthStore.getState().isAuthenticated;
  
//       if (isAuthenticated && inAuthGroup) {
//         // توكين صحيح والمستخدم في صفحة الدخول -> تحويل تلقائي للرئيسية
//         router.replace("/(tabs)/home");
//       } else if (!isAuthenticated && !inAuthGroup) {
//         // توكين غير صحيح/غير موجود والمستخدم في صفحات التطبيق -> تحويل للتسجيل
//         router.replace("/(auth)/login");
//       }
//     }, [isCheckingAuth, segments]);
  
//     // شاشة التحميل أثناء استجابة الـ API من سيرفر NestJS
//     if (isCheckingAuth) {
//       return (
//         <View className="flex-1 bg-tb-background items-center justify-center">
//           <ActivityIndicator size="large" color="#BF9B30" />
//         </View>
//       );
//     }

//   return (
//     <Stack screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
//     </Stack>
//   )
// }









// // i needs to make the main layout as a side drawer for the navigation between pages ............ not using the bottom bar .......... make its design very modern ........ 




// // src/app/_layout.tsx
// import "../../global.css";
// import React, { useEffect, useState } from "react";
// import { View, ActivityIndicator, I18nManager } from "react-native";
// import { Stack, useRouter, useSegments } from "expo-router";
// import { useAuthStore } from "@/store/useAuthStore";

// if (!I18nManager.isRTL) {
//   I18nManager.allowRTL(true);
//   I18nManager.forceRTL(true);
// }

// export default function RootLayout() {
//   const router = useRouter();
//   const segments = useSegments();
//   const [isReady, setIsReady] = useState(false);

//   const { isAuthenticated, initializeAuth, token } = useAuthStore();

  
//   console.log(token, 'token in layout');

//   useEffect(() => {
//     const init = async () => {
//       await initializeAuth();
//       setIsReady(true);
//     };

//     init();
//   }, []);

//   useEffect(() => {
//     if (!isReady) return;

//     const inAuthGroup = segments[0] === "(auth)";

//     if (isAuthenticated && inAuthGroup) {
//       router.replace("/(tabs)/home");
//     } else if (!isAuthenticated && !inAuthGroup) {
//       router.replace("/(auth)/login");
//     }
//   }, [isReady, isAuthenticated, segments]);

//   if (!isReady) {
//     return (
//       <View className="flex-1 bg-tb-background items-center justify-center">
//         <ActivityIndicator size="large" color="#BF9B30" />
//       </View>
//     );
//   }

//   return (
//     <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F4F7FE" } }}>
//       <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
//       <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
//     </Stack>
//   );
// }






// src/app/_layout.tsx
import "../../global.css";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, I18nManager, AppState, Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import axios from "axios";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

// Catches render errors in every screen without its own boundary.
export { RouteErrorBoundary as ErrorBoundary };

// Move RTL config inside module initialization or root effect without forcing state resets while rendering
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
// 1. إنشاء نسخة Singleton من QueryClient خارج المكون
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx answers (not found, forbidden, …) won't change on retry.
      retry: (failureCount, error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        return !(status && status >= 400 && status < 500) && failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 دقائق
    },
  },
});

// React Native has no window focus: treat returning to the app as focus so stale queries
// (e.g. an enrollment an admin just approved) refetch.
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
    return () => subscription.remove();
  });
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await initializeAuth();
      if (isMounted) {
        setIsReady(true);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Drop the previous user's cached data whenever the session ends (logout or expired refresh).
  useEffect(() => {
    if (!isAuthenticated) queryClient.clear();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Use setImmediate / setTimeout to defer navigation until after the NavigationContainer mounts fully
    const timeout = setTimeout(() => {
      if (isAuthenticated && inAuthGroup) {
        router.replace("/(tabs)/home");
      } else if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)/login");
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [isReady, isAuthenticated, segments]);

  if (!isReady) {
    return (
      <View className="flex-1 bg-tb-background items-center justify-center">
        <ActivityIndicator size="large" color="#BF9B30" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient} >
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F4F7FE" } }}>
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
    
  );
}