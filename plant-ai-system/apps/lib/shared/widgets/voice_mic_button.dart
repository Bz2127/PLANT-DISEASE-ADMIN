import 'package:farmer_mobile_app/features/voice/voice_assistant_service.dart';
import 'package:flutter/material.dart';
import 'package:avatar_glow/avatar_glow.dart';

class VoiceMicButton extends StatefulWidget {
  const VoiceMicButton({super.key});

  @override
  State<VoiceMicButton> createState() => _VoiceMicButtonState();
}

class _VoiceMicButtonState extends State<VoiceMicButton> {
  final VoiceAssistantService _voiceService = VoiceAssistantService();

  bool _isListening = false;
  String _lastWords = "";

  Future<void> _toggleListening() async {
    if (_isListening) {
      await _voiceService.stopListening();

      if (mounted) {
        setState(() => _isListening = false);
      }

      return;
    }

    if (!_voiceService.isAvailable) {
      await _voiceService.initVoice(context);

      if (!_voiceService.isAvailable) {
        if (mounted) {
          setState(() => _isListening = false);
        }
        return;
      }
    }

    if (mounted) {
      setState(() => _isListening = true);
    }

    _voiceService.startListening(
      context: context,
      onResult: (text) {
        if (mounted) {
          setState(() => _lastWords = text);
        }
      },
      onListeningStateChanged: (isListening) {
        if (mounted) {
          setState(() => _isListening = isListening);
        }
      },
    );
  }

  @override
  void dispose() {
    _voiceService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_isListening)
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.black54,
            child: Text(
              _lastWords,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        AvatarGlow(
          animate: _isListening,
          glowColor: Colors.blue,
          duration: const Duration(milliseconds: 2000),
          repeat: true,
          child: FloatingActionButton(
            onPressed: _toggleListening,
            backgroundColor: Colors.blue,
            child: Icon(
              _isListening ? Icons.mic : Icons.mic_none,
              size: 30,
            ),
          ),
        ),
      ],
    );
  }
}