import 'dart:io';
import 'package:flutter/material.dart';
import 'package:farmer_mobile_app/shared/models/disease_model.dart';
import 'package:farmer_mobile_app/features/advisory/advisory_screen.dart';
import 'package:farmer_mobile_app/features/voice/voice_assistant_service.dart';

class ResultScreen extends StatefulWidget {
  final String imagePath;
  final Map<String, dynamic> analysisData; // Added parameter to handle the pre-loaded backend data

  const ResultScreen({
    super.key, 
    required this.imagePath, 
    required this.analysisData, // Initialized in constructor
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  final VoiceAssistantService _voiceService = VoiceAssistantService();
  
  DiseaseResult? _analysisResult;
  String? _errorMessage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initVoiceAndParseData();
  }

  Future<void> _initVoiceAndParseData() async {
    try {
      // 1. Initialize Text-to-Speech Engine
      await _voiceService.initVoice(context);
      
      // 2. Validate Image File Presence Locally
      final File imageFile = File(widget.imagePath);
      if (widget.imagePath.isNotEmpty && !imageFile.existsSync()) {
        throw Exception("Image file not found at: ${widget.imagePath}");
      }

      // 3. Process the data passed from DetectionScreen instantly (No second API call!)
      if (widget.analysisData.isNotEmpty) {
        setState(() {
          _analysisResult = DiseaseResult.fromJson(widget.analysisData);
          _isLoading = false;
        });
        
        // 4. Trigger voice notification updates once layout data fields mount
        if (mounted) {
          final currentLanguage = Localizations.localeOf(context).languageCode;
          if (currentLanguage == 'am') {
            _voiceService.speak("የምርመራ ውጤት ዝግጁ ነው። ማብራሪያውን ለመስማት የድምፅ ምልክቱን ይጫኑ።");
          } else {
            _voiceService.speak("Analysis complete. Tap the speaker icon to listen to treatment instructions.");
          }
        }
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _voiceService.stopListening();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String activeLanguage = Localizations.localeOf(context).languageCode;
    final bool isAmharic = activeLanguage == 'am';

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      appBar: AppBar(
        title: Text(isAmharic ? "የምርመራ ውጤት" : "Detection Result"),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.lightbulb_outline, color: Colors.yellow),
            onPressed: () {
              if (_analysisResult != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AdvisoryScreen(scanId: _analysisResult!.id),
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (_isLoading) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(color: Colors.green),
                  const SizedBox(height: 15),
                  Text(
                    isAmharic ? "AI ናሙናውን እየመረመረ ነው..." : "Analyzing plant sample via AI...", 
                    style: const TextStyle(color: Colors.white70)
                  ),
                ],
              ),
            );
          }

          if (_errorMessage != null || _analysisResult == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      isAmharic 
                          ? "ምርመራው አልተሳካም\n${_errorMessage ?? 'ምንም መረጃ አልተገኘም'}" 
                          : "Analysis Failed\n${_errorMessage ?? 'No data provided.'}",
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
                    ),
                  ],
                ),
              ),
            );
          }

          final result = _analysisResult!;
          final bool isWideScreen = constraints.maxWidth > 650;
          final double dynamicHorizontalPadding = isWideScreen ? constraints.maxWidth * 0.15 : 20.0;

          final String systemTitle = isAmharic ? result.nameAm : result.nameEn;
          final String secondaryTitle = isAmharic ? result.nameEn : result.nameAm;

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (widget.imagePath.isNotEmpty)
                  SizedBox(
                    height: isWideScreen ? 350 : 250,
                    width: double.infinity,
                    child: Image.file(File(widget.imagePath), fit: BoxFit.cover),
                  ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: dynamicHorizontalPadding, vertical: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isAmharic 
                          ? "እርግጠኝነት: ${(result.confidence * 100).toInt()}%" 
                          : "Confidence: ${(result.confidence * 100).toInt()}%",
                        style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)
                      ),
                      const SizedBox(height: 5),
                      LinearProgressIndicator(
                        value: result.confidence,
                        color: Colors.green,
                        backgroundColor: Colors.white10,
                        minHeight: 6,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        systemTitle,
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)
                      ),
                      Text(
                        secondaryTitle,
                        style: const TextStyle(fontSize: 18, color: Colors.grey)
                      ),
                      const SizedBox(height: 30),
                      
                      _buildAdvisoryCard(
                        title: isAmharic ? "የባህላዊ/ኦርጋኒክ ማከሚያ መንገዶች" : "Organic Treatment", 
                        content: result.treatmentOrganic, 
                        color: Colors.green,
                        langCode: activeLanguage
                      ),
                      _buildAdvisoryCard(
                        title: isAmharic ? "የኬሚካማዊ ማከሚያ መንገዶች" : "Chemical Treatment", 
                        content: result.treatmentChemical, 
                        color: Colors.orange,
                        langCode: activeLanguage
                      ),
                      _buildAdvisoryCard(
                        title: isAmharic ? "ቅድመ መከላከል መመሪያዎች" : "Prevention", 
                        content: result.prevention, 
                        color: Colors.blue,
                        langCode: activeLanguage
                      ),
                    ],
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAdvisoryCard({
    required String title, 
    required String content, 
    required Color color,
    required String langCode
  }) {
    if (content.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      width: double.infinity,
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color.withOpacity(0.5))
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(title, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              IconButton(
                icon: Icon(Icons.volume_up, color: color, size: 22),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {
                  _voiceService.speak(content, forceLanguageCode: langCode);
                },
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(content, style: const TextStyle(color: Colors.white70, height: 1.4)),
        ],
      ),
    );
  }
}