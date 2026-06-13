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

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    redirect: (BuildContext context, GoRouterState state) async {
      final prefs = await SharedPreferences.getInstance();
      final String? token = prefs.getString('auth_token');
      final bool isLoggedIn = token != null && token.isNotEmpty && token != 'fake_token_123';
      final String currentPath = state.matchedLocation;
      final bool isAuthRoute = currentPath == '/login' || currentPath == '/register';
      final bool isSplashRoute = currentPath == '/splash' || currentPath == '/onboarding' || currentPath == '/language';

      if (!isLoggedIn && !isAuthRoute && !isSplashRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
      GoRoute(path: '/language', builder: (context, state) => const LanguageScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/detection', builder: (context, state) => const DetectionScreen()),
      
      //  CORRECTED ROUTE
      GoRoute(
        path: '/result',
        builder: (context, state) {
          // Check if the parameter package is a Map passed from DetectionScreen
          if (state.extra is Map<String, dynamic>) {
            final params = state.extra as Map<String, dynamic>;
            final imagePath = params['imagePath'] as String? ?? '';
            final analysisData = params['analysisData'] as Map<String, dynamic>? ?? {};

            return ResultScreen(
              imageUrl: imagePath,
              analysisData: analysisData,
            );
          }

          // Fallback safe defaults if empty state configurations are called
          return const ResultScreen(
            imageUrl: '',
            analysisData: {},
          );
        },
      ),
      
      GoRoute(path: '/scan', builder: (context, state) => const DetectionScreen()),
      GoRoute(path: '/history', builder: (context, state) => const HistoryScreen()),
      GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
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