import 'package:farmer_mobile_app/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';

class LanguageScreen extends StatefulWidget {
  const LanguageScreen({super.key});

  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  final FlutterTts _tts = FlutterTts();
  String _tempSelectedCode = 'am'; // Default choice

  @override
  void initState() {
    super.initState();
    _playAutoInstruction();
  }

  // 🔊 UX: Auto-plays instructions on screen load
  // Note: Chrome may block this until you click anywhere on the page first.
  Future<void> _playAutoInstruction() async {
    try {
      await _tts.setLanguage("en-US");
      await _tts.speak("Please choose your language.");
      await Future.delayed(const Duration(seconds: 2));
      await _tts.setLanguage("am-ET");
      await _tts.speak("እባክዎን ቋንቋዎን ይምረጡ");
    } catch (e) {
      debugPrint("TTS Error: $e");
    }
  }

  // 🔊 UX: Confirms the specific selection
  Future<void> _speakSelection(String langCode) async {
    if (langCode == 'am') {
      await _tts.setLanguage("am-ET");
      await _tts.speak("አማርኛ ተመርጧል");
    } else {
      await _tts.setLanguage("en-US");
      await _tts.speak("English selected");
    }
  }

  // 💾 Saves choice to Local Storage and navigates to Dashboard
  Future<void> _handleContinue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language_code', _tempSelectedCode);

    if (mounted) {
      context.go('/home'); // Navigates via AppRouter
    }
  }

  @override
  Widget build(BuildContext context) {
    // Localization bridge
    final l10n = AppLocalizations.of(context)!;
    final Size size = MediaQuery.of(context).size;

    // Check if the screen is a small mobile device
    final bool isSmallScreen = size.height < 700;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                // Forces Column to be at least the height of the screen
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Column(
                    children: [
                      SizedBox(height: isSmallScreen ? 20 : 40),

                      // 🌿 Logo Section (KARE Branding)
                      const Icon(Icons.eco, color: Color(0xFF4CAF50), size: 60),
                      Text(
                        "KARE",
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 4,
                        ),
                      ),

                      SizedBox(height: isSmallScreen ? 20 : 40),

                      // 🌍 Title Section (Localized)
                      Text(
                        l10n.languageSelect,
                        style: GoogleFonts.notoSans(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Text(
                        "(Say or select language)",
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                      ),

                      SizedBox(height: isSmallScreen ? 20 : 40),

                      // 🇪🇹 Amharic Selection Button
                      _buildLanguageButton(
                        title: "አማርኛ",
                        subTitle: "(Amharic)",
                        isSelected: _tempSelectedCode == 'am',
                        isSmall: isSmallScreen,
                        onTap: () {
                          setState(() => _tempSelectedCode = 'am');
                          _speakSelection('am');
                        },
                      ),

                      const SizedBox(height: 20),

                      // 🇬🇧 English Selection Button
                      _buildLanguageButton(
                        title: "English",
                        subTitle: "",
                        isSelected: _tempSelectedCode == 'en',
                        isSmall: isSmallScreen,
                        onTap: () {
                          setState(() => _tempSelectedCode = 'en');
                          _speakSelection('en');
                        },
                      ),

                      // Spacer pushes the following widgets to the bottom
                      const Spacer(),

                      // Confirmation Texts (Static instruction)
                      const Text(
                        "Confirm your command.",
                        style: TextStyle(color: Colors.white70),
                      ),
                      const Text(
                        "አረጋግጥ የሚለውን ይጫኑ",
                        style: TextStyle(color: Colors.white70),
                      ),

                      // 🟢 Action Button: CONTINUE
                      Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 30,
                          vertical: isSmallScreen ? 15 : 30,
                        ),
                        child: SizedBox(
                          width: double.infinity,
                          height: 65,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF4CAF50),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                            ),
                            onPressed: _handleContinue,
                            child: const Text(
                              "CONTINUE / ቀጥል",
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // Reusable Language Toggle Button
  Widget _buildLanguageButton({
    required String title,
    required String subTitle,
    required bool isSelected,
    required bool isSmall,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 30),
        width: double.infinity,
        height: isSmall ? 75 : 90, // Responsive height adjustment
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFB38B4D) : const Color(0xFF1B3022),
          borderRadius: BorderRadius.circular(15),
          border:
              isSelected ? Border.all(color: Colors.white, width: 2.5) : null,
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                title,
                style: GoogleFonts.notoSansEthiopic(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (subTitle.isNotEmpty)
                Text(
                  subTitle,
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
