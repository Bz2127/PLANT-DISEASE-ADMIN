import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:farmer_mobile_app/features/auth/login_screen.dart';
import 'package:farmer_mobile_app/features/auth/register_screen.dart';
import 'package:farmer_mobile_app/features/detection/detection_screen.dart';
import 'package:farmer_mobile_app/features/detection/result_screen.dart';
import 'package:farmer_mobile_app/features/history/history_screen.dart';
import 'package:farmer_mobile_app/features/splash/onboarding_screen.dart';
import 'package:farmer_mobile_app/features/splash/splash_screen.dart';
import 'package:farmer_mobile_app/features/language_setup/language_screen.dart';
import 'package:farmer_mobile_app/features/home/home_screen.dart';
import 'package:farmer_mobile_app/features/advisory/advisory_screen.dart';
import 'package:farmer_mobile_app/features/profile/profile_screen.dart';
import 'package:farmer_mobile_app/features/notifications/notification_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: GoRouterRefreshStream(
      Stream.periodic(const Duration(seconds: 1)),
    ),
    redirect: (BuildContext context, GoRouterState state) {
      final String currentPath = state.matchedLocation;

      final bool isAuthRoute =
          currentPath == '/login' || currentPath == '/register';

      final bool isSplashRoute =
          currentPath == '/splash' ||
          currentPath == '/onboarding' ||
          currentPath == '/language';

      return null;
    },
    routes: [
      GoRoute(
          path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen()),
      GoRoute(
          path: '/language',
          builder: (context, state) => const LanguageScreen()),
      GoRoute(
          path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(
          path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen()),
      GoRoute(
          path: '/detection',
          builder: (context, state) => const DetectionScreen()),

      GoRoute(
        path: '/result',
        builder: (context, state) {
          if (state.extra is Map<String, dynamic>) {
            final params = state.extra as Map<String, dynamic>;
            final imagePath = params['imagePath'] as String? ?? '';
            final analysisData =
                params['analysisData'] as Map<String, dynamic>? ?? {};

            return ResultScreen(
              imageUrl: imagePath,
              analysisData: analysisData,
            );
          }

          return const ResultScreen(
            imageUrl: '',
            analysisData: {},
          );
        },
      ),

      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationScreen(),
      ),

      GoRoute(
          path: '/scan', builder: (context, state) => const DetectionScreen()),
      GoRoute(
          path: '/history',
          builder: (context, state) => const HistoryScreen()),
      GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen()),

      GoRoute(
        path: '/advisory/:scanId',
        builder: (context, state) {
          final scanId = state.pathParameters['scanId']!;
          return AdvisoryScreen(scanId: scanId);
        },
      ),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    stream.listen((_) {
      notifyListeners();
    });
  }
}