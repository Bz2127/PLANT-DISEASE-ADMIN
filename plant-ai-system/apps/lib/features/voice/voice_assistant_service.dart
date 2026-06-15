import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';

class VoiceAssistantService {
  final SpeechToText _speechToText = SpeechToText();
  final FlutterTts _flutterTts = FlutterTts();

  bool _isSpeechAvailable = false;
  bool _isInitialized = false;

  final Set<String> _supportedLanguages = {};

  bool get isAvailable => _isSpeechAvailable;
  bool get isListening => _speechToText.isListening;

  Future<void> initVoice(BuildContext context) async {
    if (_isInitialized) return;

    try {
      final PermissionStatus permissionStatus =
          await Permission.microphone.request();

      if (!permissionStatus.isGranted) {
        debugPrint(
          "Microphone permission denied by user during voice service initialization.",
        );
        _isSpeechAvailable = false;
        return;
      }

      _isSpeechAvailable = await _speechToText.initialize(
        onError: (val) => debugPrint('STT Error tracing: $val'),
        onStatus: (val) => debugPrint('STT Status tracking: $val'),
      );

      final Locale currentLocale = Localizations.localeOf(context);
      final String languageCode = currentLocale.languageCode;

      final languages = await _flutterTts.getLanguages;
      _supportedLanguages.addAll(languages.cast<String>());

      if (languageCode == 'am') {
        await _flutterTts.setLanguage("am-ET");
        await _flutterTts.setSpeechRate(0.40);
        await _flutterTts.setPitch(1.0);
      } else {
        await _flutterTts.setLanguage("en-US");
        await _flutterTts.setSpeechRate(0.50);
        await _flutterTts.setPitch(1.0);
      }

      _isInitialized = true;
    } catch (e) {
      debugPrint(
        "Voice Hardware Engine failed to initialize safely: $e",
      );
    }
  }

  Future<void> speak(
    String text, {
    String? forceLanguageCode,
  }) async {
    if (text.isEmpty) return;

    try {
      String targetLang = forceLanguageCode ?? "en-US";
      String ttsLang = targetLang == 'am' ? "am-ET" : "en-US";

      bool isSupported = _supportedLanguages.contains(ttsLang);

      if (isSupported) {
        await _flutterTts.setLanguage(ttsLang);
      } else {
        debugPrint(
          "Amharic voice pack missing, falling back to English.",
        );
        await _flutterTts.setLanguage("en-US");
      }

      await _flutterTts.setSpeechRate(
        targetLang == 'am' ? 0.4 : 0.5,
      );

      await _flutterTts.speak(text);
    } catch (e) {
      debugPrint("TTS Error: $e");
    }
  }

  void startListening({
    required BuildContext context,
    required Function(String) onResult,
    required Function(bool) onListeningStateChanged,
  }) async {
    try {
      PermissionStatus status = await Permission.microphone.status;

      if (status.isDenied || status.isPermanentlyDenied) {
        status = await Permission.microphone.request();
      }

      if (!status.isGranted) {
        debugPrint(
          "Voice action skipped: Audio stream tracking is blocked due to missing permissions.",
        );

        onListeningStateChanged(false);

        if (status.isPermanentlyDenied) {
          await openAppSettings();
        }

        return;
      }

      if (!_isSpeechAvailable) {
        await initVoice(context);

        if (!_isSpeechAvailable) {
          onListeningStateChanged(false);
          return;
        }
      }

      final Locale currentLocale = Localizations.localeOf(context);

      final String activeLocaleId =
          currentLocale.languageCode == 'am'
              ? "am_ET"
              : "en_US";

      onListeningStateChanged(true);

      await _speechToText.listen(
        onResult: (result) {
          final String command =
              result.recognizedWords.trim().toLowerCase();

          if (result.finalResult) {
            onListeningStateChanged(false);
            _processCommand(
              context,
              command,
              currentLocale.languageCode,
            );
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

      debugPrint(
        "Microphone active recording loop failed to hook stream listener: $e",
      );
    }
  }

  Future<void> stopListening() async {
    try {
      await _speechToText.stop();
    } catch (e) {
      debugPrint(
        "Failed to execute shutdown on underlying hardware layout: $e",
      );
    }
  }

  Future<void> dispose() async {
    try {
      await _speechToText.stop();
      await _flutterTts.stop();
    } catch (_) {}
  }

  void _processCommand(
    BuildContext context,
    String command,
    String languageCode,
  ) {
    if (!context.mounted || command.isEmpty) return;

    final bool isAmharic = languageCode == 'am';

    if (command.contains("መርምር") ||
        command.contains("አዲስ") ||
        command.contains("scan") ||
        command.contains("detection") ||
        command.contains("detect")) {
      final String alertText = isAmharic
          ? "ምርመራ እየጀመርኩ ነው። ቅጠሉን ያሳዩ።"
          : "Starting camera plant disease detection scan.";

      speak(
        alertText,
        forceLanguageCode: languageCode,
      );

      context.go('/detection');
    } else if (command.contains("ታሪክ") ||
        command.contains("ማህደር") ||
        command.contains("history") ||
        command.contains("log") ||
        command.contains("scans")) {
      final String alertText = isAmharic
          ? "የቀድሞ ምርመራዎች ውጤት ማህደር እዚህ አለ።"
          : "Opening your previous scan log history tracking table.";

      speak(
        alertText,
        forceLanguageCode: languageCode,
      );

      context.go('/history');
    } else if (command.contains("መነሻ") ||
        command.contains("ዋና") ||
        command.contains("home") ||
        command.contains("dashboard") ||
        command.contains("main")) {
      final String alertText = isAmharic
          ? "ወደ ዋናው ማውጫ እየተመለስን ነው።"
          : "Navigating back to main dashboard hub view.";

      speak(
        alertText,
        forceLanguageCode: languageCode,
      );

      context.go('/home');
    } else if (command.contains("ማስተካከያ") ||
        command.contains("ቅንብር") ||
        command.contains("settings") ||
        command.contains("profile") ||
        command.contains("setup")) {
      final String alertText = isAmharic
          ? "የቅንብሮች ገጽን በመክፈት ላይ።"
          : "Loading application settings configuration menu.";

      speak(
        alertText,
        forceLanguageCode: languageCode,
      );

      context.go('/settings');
    } else {
      final String alertText = isAmharic
          ? "ትዕዛዙ አልገባኝም። እባክዎ እንደገና ይሞክሩ። ምርመር፣ ታሪክ፣ ወይም መነሻ ይበሉ።"
          : "Command not recognized. Please try stating: scan, history, or home screen.";

      speak(
        alertText,
        forceLanguageCode: languageCode,
      );
    }
  }
}