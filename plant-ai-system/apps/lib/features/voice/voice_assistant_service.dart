import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:permission_handler/permission_handler.dart'; // 🌟 Added runtime permissions handler

class VoiceAssistantService {
  final SpeechToText _speechToText = SpeechToText();
  final FlutterTts _flutterTts = FlutterTts();

  bool _isSpeechAvailable = false;
  
  /// Get current system registration status of mic listeners
  bool get isAvailable => _isSpeechAvailable;
  bool get isListening => _speechToText.isListening;

  /// Initializes the voice engines dynamically.
  /// Accepts the active UI BuildContext to establish immediate language configurations.
  Future<void> initVoice(BuildContext context) async {
    try {
      // 🌟 Request microphone access runtime permissions safely
      final PermissionStatus permissionStatus = await Permission.microphone.request();
      
      if (!permissionStatus.isGranted) {
        debugPrint("Microphone permission denied by user during voice service initialization.");
        _isSpeechAvailable = false;
        return;
      }

      _isSpeechAvailable = await _speechToText.initialize(
        onError: (val) => debugPrint('STT Error tracing: $val'),
        onStatus: (val) => debugPrint('STT Status tracking: $val'),
      );

      // Read current active application locale code safely
      final Locale currentLocale = Localizations.localeOf(context);
      final String languageCode = currentLocale.languageCode; // 'am' or 'en'

      if (languageCode == 'am') {
        await _flutterTts.setLanguage("am-ET");
        await _flutterTts.setSpeechRate(0.40); // Slower pacing for natural Amharic audio production
        await _flutterTts.setPitch(1.0);
      } else {
        await _flutterTts.setLanguage("en-US");
        await _flutterTts.setSpeechRate(0.50);
        await _flutterTts.setPitch(1.0);
      }
    } catch (e) {
      debugPrint("Voice Hardware Engine failed to initialize safely: $e");
    }
  }

  /// Plays string audio content through native speakers using active language configurations.
 Future<void> speak(String text, {String? forceLanguageCode}) async {
  if (text.isEmpty) return;
  
  try {
    // 1. Determine which language to try first
    String targetLang = forceLanguageCode ?? "en-US";
    
    // 2. Map 'am' to the code the TTS engine expects
    String ttsLang = (targetLang == 'am') ? "am-ET" : "en-US";

    // 3. Safety Check: Does the phone support this language?
    List<dynamic> languages = await _flutterTts.getLanguages;
    bool isSupported = languages.contains(ttsLang);

    if (isSupported) {
      await _flutterTts.setLanguage(ttsLang);
    } else {
      // FALLBACK: If Amharic isn't supported, use English
      debugPrint("Amharic voice pack missing, falling back to English.");
      await _flutterTts.setLanguage("en-US");
    }

    // 4. Set speed and speak
    await _flutterTts.setSpeechRate(targetLang == 'am' ? 0.4 : 0.5);
    await _flutterTts.speak(text);
    
  } catch (e) {
    debugPrint("TTS Error: $e");
  }
}
  /// Begins real-time speech analysis using matching script properties
  void startListening({
    required BuildContext context, 
    required Function(String) onResult,
    required Function(bool) onListeningStateChanged,
  }) async {
    try {
      // 🌟 Re-verify hardware audio stream permission status layout before executing stream capture
      PermissionStatus status = await Permission.microphone.status;
      if (status.isDenied || status.isPermanentlyDenied) {
        status = await Permission.microphone.request();
      }

      if (!status.isGranted) {
        debugPrint("Voice action skipped: Audio stream tracking is blocked due to missing permissions.");
        onListeningStateChanged(false);
        if (status.isPermanentlyDenied) {
          await openAppSettings(); // Help user toggle permission on their ZTE interface
        }
        return;
      }

      // 🌟 If initialized flag is missing or lost, auto-repair engine instantiation now
      if (!_isSpeechAvailable) {
        debugPrint("Speech engine was uninitialized. Attempting emergency setup initialization...");
        await initVoice(context);
        if (!_isSpeechAvailable) {
          debugPrint("Speech configuration requested but microphone streaming hardware is unavailable.");
          onListeningStateChanged(false);
          return;
        }
      }

      final Locale currentLocale = Localizations.localeOf(context);
      final String activeLocaleId = currentLocale.languageCode == 'am' ? "am_ET" : "en_US";

      onListeningStateChanged(true);

      await _speechToText.listen(
        onResult: (result) {
          final String command = result.recognizedWords.trim().toLowerCase();
          
          // Execute state operations once the voice processing loop completes text derivation
          if (result.finalResult) {
            onListeningStateChanged(false);
            _processCommand(context, command, currentLocale.languageCode);
            onResult(command);
          }
        },
        localeId: activeLocaleId,
        cancelOnError: true,
        listenFor: const Duration(seconds: 15),
        pauseFor: const Duration(seconds: 4),
      );
    } catch (e) {
      onListeningStateChanged(false);
      debugPrint("Microphone active recording loop failed to hook stream listener: $e");
    }
  }

  /// Force manual termination of the active voice pipeline
  Future<void> stopListening() async {
    try {
      await _speechToText.stop();
    } catch (e) {
      debugPrint("Failed to execute shutdown on underlying hardware layout: $e");
    }
  }

  /// Decodes voice text configurations cleanly to transition pages without hardcoded routes
  void _processCommand(BuildContext context, String command, String languageCode) {
    if (!context.mounted || command.isEmpty) return;

    final bool isAmharic = (languageCode == 'am');

    // 1. MATCH SCAN ROUTE COMMAND SIGNATURES
    if (command.contains("መርምር") || command.contains("አዲስ") || 
        command.contains("scan") || command.contains("detection") || command.contains("detect")) {
      
      final String alertText = isAmharic ? "ምርመራ እየጀመርኩ ነው። ቅጠሉን ያሳዩ።" : "Starting camera plant disease detection scan.";
      speak(alertText, forceLanguageCode: languageCode);
      
      context.go('/detection');
    } 
    
    // 2. MATCH HISTORY OVERVIEW COMMAND SIGNATURES
    else if (command.contains("ታሪክ") || command.contains("ማህደር") || 
             command.contains("history") || command.contains("log") || command.contains("scans")) {
      
      final String alertText = isAmharic ? "የቀድሞ ምርመራዎች ውጤት ማህደር እዚህ አለ።" : "Opening your previous scan log history tracking table.";
      speak(alertText, forceLanguageCode: languageCode);
      
      context.go('/history');
    } 
    
    // 3. MATCH SYSTEM HOME SCREEN VIEW SIGNATURES
    else if (command.contains("መነሻ") || command.contains("ዋና") || 
             command.contains("home") || command.contains("dashboard") || command.contains("main")) {
      
      final String alertText = isAmharic ? "ወደ ዋናው ማውጫ እየተመለስን ነው።" : "Navigating back to main dashboard hub view.";
      speak(alertText, forceLanguageCode: languageCode);
      
      context.go('/home');
    }
    
    // 4. MATCH SYSTEM SETTINGS COMMAND SIGNATURES
    else if (command.contains("ማስተካከያ") || command.contains("ቅንብር") || 
             command.contains("settings") || command.contains("profile") || command.contains("setup")) {
      
      final String alertText = isAmharic ? "የቅንብሮች ገጽን በመክፈት ላይ።" : "Loading application settings configuration menu.";
      speak(alertText, forceLanguageCode: languageCode);
      
      context.go('/settings');
    }

    // 5. UNRECOGNIZED INPUT SYSTEM LEVEL SAFETY VALVE
    else {
      final String alertText = isAmharic 
          ? "ትዕዛዙ አልገባኝም። እባክዎ እንደገና ይሞክሩ። ምርመር፣ ታሪክ፣ ወይም መነሻ ይበሉ።" 
          : "Command not recognized. Please try stating: scan, history, or home screen.";
      speak(alertText, forceLanguageCode: languageCode);
    }
  }
}