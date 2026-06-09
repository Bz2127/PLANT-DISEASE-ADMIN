import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'dart:io';
import 'package:farmer_mobile_app/shared/widgets/voice_mic_button.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class ResultDetailScreen extends StatefulWidget {
  final File image;
  const ResultDetailScreen({super.key, required this.image});

  @override
  State<ResultDetailScreen> createState() => _ResultDetailScreenState();
}

class _ResultDetailScreenState extends State<ResultDetailScreen> {
  final FlutterTts _tts = FlutterTts();

  @override
  void initState() {
    super.initState();
    _speakResult();
  }

  Future<void> _speakResult() async {
    try {
      await _tts.setLanguage("am-ET");
      await _tts.speak("ባክቴሪያል ዋይልት ተገኝቷል። የልመና ደረጃ ዘጠና አራት ፐርሰንት ነው።");
    } catch (e) {
      debugPrint("TTS Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          "Detailed Result",
          style: GoogleFonts.notoSans(color: Colors.white),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          children: [
            // 1. FIXED IMAGE SECTION: Added ClipRRect and Error Handling
            Container(
              height: 220,
              width: double.infinity,
              margin: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.white24),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child:
                    kIsWeb
                        // ✅ Fix for Chrome: Use Image.network for the web blob path
                        ? Image.network(
                          widget.image.path,
                          fit: BoxFit.cover,
                          errorBuilder:
                              (context, error, stackTrace) => const Center(
                                child: Icon(
                                  Icons.broken_image,
                                  color: Colors.white,
                                ),
                              ),
                        )
                        // ✅ Fix for Mobile: Use Image.file for Android/iOS paths
                        : Image.file(
                          widget.image,
                          fit: BoxFit.cover,
                          errorBuilder:
                              (context, error, stackTrace) => const Center(
                                child: Icon(
                                  Icons.broken_image,
                                  color: Colors.white,
                                ),
                              ),
                        ),
              ),
            ),

            // 2. Detection Status Card
            _buildDetectionHeader(),

            const SizedBox(height: 20),

            // 3. Treatment Sections (A, B, C)
            _buildTreatmentCard(
              letter: "A",
              titleEn: "Chemical Treatment",
              titleAm: "ኬሚካል ሕክምና",
              steps: [
                "1. Simplify action steps",
                "2. Acquire appropriate spray",
                "3. Prepare treatment steps",
              ],
              color: const Color(0xFF8B2635),
              icon: Icons.medication_liquid_sharp,
            ),

            _buildTreatmentCard(
              letter: "B",
              titleEn: "Organic Methods",
              titleAm: "ኦርጋኒክ ዘዴዎች",
              steps: ["1. Alternative treatments", "2. Use neem-based oils"],
              color: const Color(0xFF2E7D32),
              icon: Icons.eco,
            ),

            _buildTreatmentCard(
              letter: "C",
              titleEn: "Prevention Tips",
              titleAm: "የመከላከያ ምክሮች",
              steps: ["1. Future action points", "2. Select resistant seeds"],
              color: const Color(0xFFB38B4D),
              icon: Icons.shield_outlined,
            ),

            const SizedBox(height: 120),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: const VoiceMicButton(),
      bottomNavigationBar: _buildMiniBottomBar(context),
    );
  }

  Widget _buildDetectionHeader() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFF3E2723).withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.orange.withOpacity(0.5)),
      ),
      child: Column(
        children: [
          Text(
            "Bacterial Wilt Detected",
            style: GoogleFonts.notoSans(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            "(94% Confidence / 94% እርግጠኛነት)",
            style: GoogleFonts.notoSans(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: const LinearProgressIndicator(
              value: 0.94,
              minHeight: 12,
              backgroundColor: Colors.white10,
              color: Colors.orange,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTreatmentCard({
    required String letter,
    required String titleEn,
    required String titleAm,
    required List<String> steps,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      margin: const EdgeInsets.only(left: 20, right: 20, bottom: 15),
      decoration: BoxDecoration(
        color: color.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Stack(
        children: [
          Positioned(
            right: 20,
            top: 10,
            child: Text(
              letter,
              style: TextStyle(
                color: Colors.white.withOpacity(0.2),
                fontSize: 40,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: Colors.white, size: 45),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        titleEn,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        titleAm,
                        style: GoogleFonts.notoSansEthiopic(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                      const Divider(color: Colors.white24, height: 20),
                      ...steps.map(
                        (step) => Padding(
                          padding: const EdgeInsets.only(bottom: 5),
                          child: Text(
                            step,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.volume_up, color: Colors.white70),
                  onPressed: () => _tts.speak("$titleEn. $titleAm"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniBottomBar(BuildContext context) {
    return BottomAppBar(
      color: const Color(0xFF1B3022),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton.icon(
              onPressed: () => context.push('/history'),
              icon: const Icon(Icons.history, color: Colors.white70),
              label: const Text(
                "History",
                style: TextStyle(color: Colors.white70),
              ),
            ),
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.volume_up, color: Colors.blue),
              label: const Text(
                "Read All",
                style: TextStyle(color: Colors.blue),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
