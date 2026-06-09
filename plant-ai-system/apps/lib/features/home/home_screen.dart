import 'package:farmer_mobile_app/shared/widgets/voice_mic_button.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
// Import your screen to allow direct dynamic fallback rendering if GoRouter paths shift
import '../advisory/advisory_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _farmerName = "Loading...";
  String _farmerPhone = "";
  bool _isAmharic = false;
  String _latestScanId = "0";

  @override
  void initState() {
    super.initState();
    _loadFarmerProfile();
  }

  Future<void> _loadFarmerProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final String currentLang = prefs.getString('user_lang') ?? "English";
    setState(() {
      _farmerName = prefs.getString('user_name') ?? "Farmer (አራሽ)";
      _farmerPhone = prefs.getString('user_phone') ?? "";
      _isAmharic = (currentLang == 'Amharic' || currentLang == 'am');
      // If no scans exist yet, this string defaults to "0" cleanly
      _latestScanId = prefs.getString('latest_scan_id') ?? "0";
    });
  }

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.of(context).size;
    final bool isSmallScreen = size.height < 700;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: size.width * 0.05,
              vertical: 20,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(size),
                SizedBox(height: isSmallScreen ? 20 : 30),
                _buildScanCard(context, size, isSmallScreen),
                SizedBox(height: isSmallScreen ? 20 : 25),
                Row(
                  children: [
                    _buildTile(
                      en: "Scan History",
                      am: "ታሪክ",
                      icon: Icons.history,
                      color: const Color(0xFFB38B4D),
                      size: size,
                      onTap: () => context.push('/history'),
                    ),
                    const SizedBox(width: 15),
                    _buildTile(
                      en: "Voice Help",
                      am: "እርዳታ",
                      icon: Icons.mic,
                      color: const Color(0xFF1B3022),
                      size: size,
                      onTap: () => debugPrint("Voice Assistant Activated for $_farmerName"),
                    ),
                  ],
                ),
                const SizedBox(height: 120),
              ],
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: const VoiceMicButton(),
      bottomNavigationBar: BottomAppBar(
        color: const Color(0xFF1B3022),
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              IconButton(
                icon: const Icon(Icons.home, color: Colors.white),
                onPressed: () => context.go('/home'),
              ),
              IconButton(
                icon: const Icon(Icons.history, color: Colors.grey),
                onPressed: () => context.push('/history'),
              ),
              const SizedBox(width: 40),
              IconButton(
                icon: const Icon(Icons.tips_and_updates, color: Colors.grey),
                onPressed: () {
                  // ✅ CORRECTION: Directly route or use native navigator push to handle string fallback safely
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => AdvisoryScreen(scanId: _latestScanId),
                    ),
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.person, color: Colors.grey),
                onPressed: () => context.push('/profile'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(Size size) {
    return Row(
      children: [
        const CircleAvatar(
          radius: 25,
          backgroundColor: Color(0xFF1B3022),
          child: Icon(Icons.person, color: Color(0xFF4CAF50)),
        ),
        const SizedBox(width: 15),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _farmerName,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.notoSans(
                  fontSize: size.width > 400 ? 18 : 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                _isAmharic 
                    ? "ጥሩ የመትከያ ቀን" 
                    : "Good day for planting",
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.grey, size: 20),
          onPressed: () async {
            final prefs = await SharedPreferences.getInstance();
            await prefs.clear();
            if (mounted) context.go('/login');
          },
        ),
      ],
    );
  }

  Widget _buildScanCard(BuildContext context, Size size, bool isSmall) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(30),
        onTap: () => context.push('/detection'),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: isSmall ? 30 : 50),
          child: Column(
            children: [
              Icon(
                Icons.camera_alt,
                size: size.width * 0.18,
                color: const Color(0xFF0D1B12),
              ),
              const SizedBox(height: 10),
              Text(
                "Scan Plant",
                style: GoogleFonts.notoSans(
                  color: Colors.black,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                "ተክል ምርመራ",
                style: GoogleFonts.notoSansEthiopic(
                  color: Colors.black54,
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTile({
    required String en,
    required String am,
    required IconData icon,
    required Color color,
    required Size size,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: Container(
        height: 140,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: Colors.white, size: 32),
                const SizedBox(height: 10),
                Text(
                  _isAmharic ? am : en,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.notoSans(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}