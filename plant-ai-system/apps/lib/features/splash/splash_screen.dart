// plant-ai-system/apps/lib/features/splash/splash_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_fonts/google_fonts.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // 1. Setup Logo Animation
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(_controller);
    _controller.forward();

    // 2. Start Logic Check
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Artificial delay so the user sees your beautiful logo
    await Future.delayed(const Duration(seconds: 3));

    final prefs = await SharedPreferences.getInstance();

    // Check 1: Is First Time User (Onboarding)?
    final bool isFirstTime = prefs.getBool('is_first_time') ?? true;

    // Check 2: Is Language Selected?
    final String? lang = prefs.getString('language_code');

    // Check 3: Is User Logged In? (Token check linked to MySQL backend validation)
    final String? token = prefs.getString('auth_token');

    if (!mounted) return;

    // --- FIXED DECISION TREE LOGIC ---
    if (isFirstTime) {
      // New user sees the onboarding walk-through introduction
      context.go('/onboarding');
    } else if (lang == null) {
      // Returning user who hasn't picked a system language yet
      context.go('/language');
    } else if (token == null || token.isEmpty) {
      // FIXED: Language is selected but no backend token exists -> Send to Login Screen
      context.go('/login');
    } else {
      // Valid backend token exists -> Safe access to Home Dashboard
      context.go('/home');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12), // KARE Dark Green
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.eco, color: Color(0xFF4CAF50), size: 100),
              const SizedBox(height: 20),
              Text(
                "KARE",
                style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 8,
                ),
              ),
              const SizedBox(height: 50),
              const SizedBox(
                width: 40,
                child: LinearProgressIndicator(
                  color: Color(0xFF4CAF50),
                  backgroundColor: Color(0xFF1B3022),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}