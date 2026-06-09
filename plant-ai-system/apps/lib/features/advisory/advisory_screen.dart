import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/api/dio_client.dart';

class AdvisoryScreen extends StatefulWidget {
  final String scanId;
  const AdvisoryScreen({super.key, required this.scanId});

  @override
  State<AdvisoryScreen> createState() => _AdvisoryScreenState();
}

class _AdvisoryScreenState extends State<AdvisoryScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAdvisory();
  }

  Future<void> _fetchAdvisory() async {
    try {
      final response = await DioClient.instance.get('/diseases/advisory/${widget.scanId}');
      
      if (mounted) {
        setState(() {
          // Explicitly extracting the nested Sequelize disease data object safely
          if (response.data != null && response.data['success'] == true) {
            _data = response.data['data'] as Map<String, dynamic>?;
          } else {
            _data = null;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error fetching advisory: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Fallback display if data matching fields are missing
    final String diseaseTitle = _data != null 
        ? (_data!['disease_name'] ?? 'Disease Details / ዝርዝር ሁኔታ')
        : 'Disease Details';

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      appBar: AppBar(
        title: Text(
          "Smart Advisory / ምክር",
          style: GoogleFonts.notoSans(color: Colors.white),
        ),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.green))
          : _data == null
              ? const Center(child: Text("No advice found.", style: TextStyle(color: Colors.white)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        diseaseTitle,
                        style: const TextStyle(color: Colors.green, fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 20),
                      // Matches the exact attributes defined in your Node.js disease model schema mapping strings
                      _buildSection("ኦርጋኒክ ሕክምና (Organic Treatment)", _data!['treatment_organic']),
                      _buildSection("ኬሚካላዊ ሕክምና (Chemical Treatment)", _data!['treatment_chemical']),
                      _buildSection("መከላከያ መንገዶች (Prevention Tips)", _data!['prevention_tips']),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSection(String title, String? content) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: const Color(0xFF1B3022),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Text(
              // If field data exists in database layout, use it. Otherwise, show a clean message.
              (content != null && content.trim().isNotEmpty) ? content : "No treatment record registered.",
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
          const SizedBox(height: 20),
        ],
      );
}