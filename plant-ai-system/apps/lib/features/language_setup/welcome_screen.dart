import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'language_screen.dart'; // Ensure you have this file created

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // 1. Deep Dark Green Background from the UI Image
      backgroundColor: const Color(0xFF0D1B12),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 80),

            // 2. Welcome Header (Amharic & English)
            Text(
              "እንኳን ደህና መጡ",
              style: GoogleFonts.notoSansEthiopic(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text(
              "(Welcome to KARE)",
              style: TextStyle(
                color: Colors.white70,
                fontSize: 18,
                letterSpacing: 1.2,
              ),
            ),

            const Spacer(),

            // 3. The Neon Glowing "Start" Button
            GestureDetector(
              onTap: () {
                // Navigate to the Language Selection Screen
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const LanguageScreen(),
                  ),
                );
              },
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // The Outer Glow Effect
                  Container(
                    width: 240,
                    height: 240,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF4CAF50).withOpacity(0.3),
                          blurRadius: 50,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                  ),
                  // The Circular Border
                  Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF4CAF50), // Neon Green
                        width: 4,
                      ),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "ጀምር",
                            style: GoogleFonts.notoSansEthiopic(
                              color: Colors.white,
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Text(
                            "(Start)",
                            style: TextStyle(color: Colors.white, fontSize: 20),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),

            // 4. Bottom Voice Assistant Bar (Section 4.9 SRD)
            Padding(
              padding: const EdgeInsets.only(bottom: 50.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "EN",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 30),

                  // Blue Mic Button
                  Container(
                    width: 70,
                    height: 70,
                    decoration: const BoxDecoration(
                      color: Color(0xFF2196F3), // Blue from UI
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.mic, color: Colors.white, size: 35),
                  ),

                  const SizedBox(width: 30),
                  const Text(
                    "አማ",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
