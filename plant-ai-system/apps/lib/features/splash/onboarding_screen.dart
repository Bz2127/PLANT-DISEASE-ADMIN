import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _pages = [
    OnboardingData(
      titleAm: "የተክል በሽታ ምርመራ",
      titleEn: "AI Disease Detection",
      desc:
          "Scan your plants and identify diseases instantly using our advanced AI.",
      icon: Icons.center_focus_strong,
      color: const Color(0xFF4CAF50),
    ),
    OnboardingData(
      titleAm: "የባለሙያ ምክር",
      titleEn: "Smart Advisory",
      desc:
          "Receive organic and chemical treatment advice specifically for your crops.",
      icon: Icons.psychology_outlined,
      color: const Color(0xFFB38B4D),
    ),
    OnboardingData(
      titleAm: "በድምፅ እርዳታ",
      titleEn: "Voice Assistant",
      desc: "Interact with the app using your voice in Amharic or English.",
      icon: Icons.mic_none_rounded,
      color: Colors.blue,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      body: Stack(
        children: [
          // 1. Sliding Content
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemCount: _pages.length,
            itemBuilder: (context, index) {
              return _buildPage(_pages[index]);
            },
          ),

          // 2. Skip Button (Top Right)
          Positioned(
            top: 50,
            right: 20,
            child: TextButton(
              onPressed: () => context.go('/language'),
              child: const Text(
                "SKIP / ዝለል",
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
            ),
          ),

          // 3. Bottom Controls
          Positioned(
            bottom: 50,
            left: 30,
            right: 30,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Page Indicators (Dots)
                Row(
                  children: List.generate(
                    _pages.length,
                    (index) => _buildDot(index == _currentPage),
                  ),
                ),

                // Next / Start Button
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4CAF50),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 40,
                      vertical: 15,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onPressed: () {
                    if (_currentPage == _pages.length - 1) {
                      context.go('/language');
                    } else {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 500),
                        curve: Curves.ease,
                      );
                    }
                  },
                  child: Text(
                    _currentPage == _pages.length - 1 ? "GET STARTED" : "NEXT",
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPage(OnboardingData data) {
    return Padding(
      padding: const EdgeInsets.all(40.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Glowing Icon Circle
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: data.color.withOpacity(0.1),
              border: Border.all(color: data.color.withOpacity(0.5), width: 2),
            ),
            child: Icon(data.icon, size: 100, color: data.color),
          ),
          const SizedBox(height: 50),
          Text(
            data.titleAm,
            textAlign: TextAlign.center,
            style: GoogleFonts.notoSansEthiopic(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            data.titleEn,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, fontSize: 18),
          ),
          const SizedBox(height: 20),
          Text(
            data.desc,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(bool isActive) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(right: 8),
      height: 10,
      width: isActive ? 25 : 10,
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF4CAF50) : Colors.grey,
        borderRadius: BorderRadius.circular(5),
      ),
    );
  }
}

class OnboardingData {
  final String titleAm;
  final String titleEn;
  final String desc;
  final IconData icon;
  final Color color;
  OnboardingData({
    required this.titleAm,
    required this.titleEn,
    required this.desc,
    required this.icon,
    required this.color,
  });
}
