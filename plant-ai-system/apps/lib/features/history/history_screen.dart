import 'package:farmer_mobile_app/shared/widgets/voice_mic_button.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/api/dio_client.dart';
// Ensure your AdvisoryScreen file path is imported correctly here
import '../advisory/advisory_screen.dart'; 

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  bool isListView = true;
  late Future<List<dynamic>> _historyFuture;

  @override
  void initState() {
    super.initState();
    _historyFuture = fetchScanHistory();
  }

  Future<List<dynamic>> fetchScanHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final Dio dio = DioClient.instance;

    try {
      final response = await dio.get(
        '/scans',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      return response.data as List<dynamic>;
    } catch (e) {
      debugPrint("History Fetch Error: $e");
      throw Exception('Failed to load history');
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
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => context.go('/home'),
        ),
        title: Column(
          children: [
            Text("Scan History", style: GoogleFonts.notoSans(fontSize: 18, fontWeight: FontWeight.bold)),
            Text("የታሪክ መዝገብ", style: GoogleFonts.notoSansEthiopic(fontSize: 14, color: Colors.white70)),
          ],
        ),
        centerTitle: true,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _historyFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.green));
          } else if (snapshot.hasError) {
            return const Center(child: Text("Error loading history", style: TextStyle(color: Colors.white)));
          }

          final scanHistory = snapshot.data!;
          return Column(
            children: [
              const SizedBox(height: 20),
              _buildViewToggle(),
              const SizedBox(height: 20),
              Expanded(
                child: isListView 
                    ? _buildHistoryList(scanHistory) 
                    : _buildMap(scanHistory),
              ),
            ],
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: const VoiceMicButton(),
      bottomNavigationBar: _buildBottomNav(context),
    );
  }

  Widget _buildViewToggle() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 40),
      padding: const EdgeInsets.all(4),
      height: 55,
      decoration: BoxDecoration(color: const Color(0xFF1B3022), borderRadius: BorderRadius.circular(30)),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => isListView = true),
              child: Container(
                decoration: BoxDecoration(color: isListView ? const Color(0xFFB38B4D) : Colors.transparent, borderRadius: BorderRadius.circular(25)),
                child: const Icon(Icons.format_list_bulleted_rounded, color: Colors.white),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => isListView = false),
              child: Container(
                decoration: BoxDecoration(color: !isListView ? const Color(0xFFB38B4D) : Colors.transparent, borderRadius: BorderRadius.circular(25)),
                child: const Icon(Icons.map_outlined, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryList(List<dynamic> scanHistory) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: scanHistory.length,
      physics: const BouncingScrollPhysics(),
      itemBuilder: (context, index) {
        final item = scanHistory[index];
        final String date = item['createdAt'] != null ? item['createdAt'].toString().substring(0, 10) : "N/A";
        final String diseaseName = item['Disease']?['disease_name'] ?? "Unknown";
        final bool isHealthy = diseaseName.toLowerCase().contains('healthy');

        return Container(
          margin: const EdgeInsets.only(bottom: 15),
          decoration: BoxDecoration(color: const Color(0xFF1B3022), borderRadius: BorderRadius.circular(20)),
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            // ✅ CORRECTION: Pass the actual runtime scan ID string into the Advisory Screen
            onTap: () {
              if (item['id'] != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AdvisoryScreen(scanId: item['id'].toString()),
                  ),
                );
              }
            },
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(15),
                    child: Container(width: 75, height: 75, color: Colors.white10, child: const Icon(Icons.eco, color: Colors.green, size: 40)),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(date, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        Text(diseaseName, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isHealthy ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isHealthy ? Colors.green : Colors.red),
                    ),
                    child: Text(isHealthy ? "Healthy" : "Disease", style: TextStyle(color: isHealthy ? Colors.green : Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMap(List<dynamic> scanHistory) {
    final markers = scanHistory
        .where((item) => item['latitude'] != null && item['longitude'] != null)
        .map((item) => Marker(
              point: LatLng(
                double.tryParse(item['latitude'].toString()) ?? 0.0,
                double.tryParse(item['longitude'].toString()) ?? 0.0,
              ),
              child: const Icon(Icons.location_on, color: Colors.red),
            ))
        .toList();

    if (markers.isEmpty) {
      return const Center(child: Text("No location data found", style: TextStyle(color: Colors.white)));
    }

    return FlutterMap(
      options: const MapOptions(
        initialCenter: LatLng(9.145, 40.489),
        initialZoom: 6,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.plantai.system.farmer_mobile_app',
        ),
        MarkerLayer(markers: markers),
      ],
    );
  }

  Widget _buildBottomNav(BuildContext context) {
    return BottomAppBar(
      color: const Color(0xFF1B3022),
      shape: const CircularNotchedRectangle(),
      notchMargin: 8.0,
      child: SizedBox(
        height: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(icon: const Icon(Icons.home, color: Colors.grey), onPressed: () => context.go('/home')),
            IconButton(icon: const Icon(Icons.history, color: Colors.white), onPressed: () {}),
            const SizedBox(width: 40),
            IconButton(icon: const Icon(Icons.tips_and_updates, color: Colors.grey), onPressed: () {}),
            IconButton(icon: const Icon(Icons.person, color: Colors.grey), onPressed: () => context.go('/profile')),
          ],
        ),
      ),
    );
  }
}