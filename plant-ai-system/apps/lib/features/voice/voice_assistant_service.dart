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
      final status = await Permission.microphone.request();

      if (!status.isGranted) {
        _isSpeechAvailable = false;
        return;
      }

      _isSpeechAvailable = await _speechToText.initialize(
        onError: (val) => debugPrint('STT Error: $val'),
        onStatus: (val) => debugPrint('STT Status: $val'),
      );

      final locale = Localizations.localeOf(context);
      final lang = locale.languageCode;

      final languages = await _flutterTts.getLanguages;
      _supportedLanguages.addAll(languages.cast<String>());

      if (lang == 'am') {
        await _flutterTts.setLanguage("am-ET");
        await _flutterTts.setSpeechRate(0.40);
      } else {
        await _flutterTts.setLanguage("en-US");
        await _flutterTts.setSpeechRate(0.50);
      }

      await _flutterTts.setPitch(1.0);

      _isInitialized = true;
    } catch (e) {
      debugPrint("Voice init failed: $e");
    }
  }

  Future<void> speak(String text, {String? forceLanguageCode}) async {
    if (text.isEmpty) return;

    try {
      final lang = forceLanguageCode ?? "en";
      final ttsLang = lang == 'am' ? "am-ET" : "en-US";

      if (_supportedLanguages.contains(ttsLang)) {
        await _flutterTts.setLanguage(ttsLang);
      } else {
        await _flutterTts.setLanguage("en-US");
      }

      await _flutterTts.setSpeechRate(lang == 'am' ? 0.4 : 0.5);
      await _flutterTts.speak(text);
    } catch (e) {
      debugPrint("TTS Error: $e");
    }
  }

  Future<void> startListening({
    required BuildContext context,
    required Function(String) onResult,
    required Function(bool) onListeningStateChanged,
  }) async {
    try {
      var status = await Permission.microphone.status;

      if (!status.isGranted) {
        status = await Permission.microphone.request();
      }

      if (!status.isGranted) {
        onListeningStateChanged(false);
        return;
      }

      if (!_isSpeechAvailable) {
        await initVoice(context);
      }

      if (!_isSpeechAvailable) {
        onListeningStateChanged(false);
        return;
      }

      final locale = Localizations.localeOf(context);
      final isAmharic = locale.languageCode == 'am';

      final localeId = isAmharic ? "am_ET" : "en_US";

      onListeningStateChanged(true);

      await _speechToText.listen(
        localeId: localeId,
        cancelOnError: true,
        listenFor: const Duration(seconds: 20),
        pauseFor: const Duration(seconds: 4),
        onResult: (result) {
          final command = result.recognizedWords.toLowerCase().trim();

          if (result.finalResult) {
            onListeningStateChanged(false);

            _processCommand(
              context,
              command,
              locale.languageCode,
            );

            onResult(command);
          }
        },
      );
    } catch (e) {
      onListeningStateChanged(false);
    }
  }

  Future<void> stopListening() async {
    await _speechToText.stop();
  }

  Future<void> dispose() async {
    await _speechToText.stop();
    await _flutterTts.stop();
  }

  bool _match(String cmd, List<String> words) {
    return words.any((w) => cmd.contains(w));
  }

  void _processCommand(
    BuildContext context,
    String command,
    String languageCode,
  ) {
    if (!context.mounted) return;

    final cmd = command.toLowerCase();
    final isAm = languageCode == 'am';

    if (_match(cmd, ["scan", "detect", "መርምር"])) {
      speak(isAm ? "ምርመራ እየጀመርኩ ነው" : "Starting scan",
          forceLanguageCode: languageCode);
      context.go('/detection');
    }

    else if (_match(cmd, ["history", "log", "ታሪክ"])) {
      speak(isAm ? "ታሪክ እንከፍታለን" : "Opening history",
          forceLanguageCode: languageCode);
      context.go('/history');
    }

    else if (_match(cmd, ["home", "dashboard", "መነሻ"])) {
      speak(isAm ? "ወደ መነሻ" : "Going home",
          forceLanguageCode: languageCode);
      context.go('/home');
    }

    else if (_match(cmd, ["profile", "user"])) {
      speak(isAm ? "ወደ ፕሮፋይል" : "Opening profile",
          forceLanguageCode: languageCode);
      context.go('/profile');
    }

    else {
      speak(
        isAm
            ? "ትእዛዝ አልተረዳሁም"
            : "Command not recognized",
        forceLanguageCode: languageCode,
      );
    }
  }
}