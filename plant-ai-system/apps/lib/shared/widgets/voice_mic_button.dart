import 'package:farmer_mobile_app/features/voice/voice_assistant_service.dart';
import 'package:flutter/material.dart';
import 'package:avatar_glow/avatar_glow.dart'; // Add this package: flutter pub add avatar_glow

class VoiceMicButton extends StatefulWidget {
  const VoiceMicButton({super.key});

  @override
  State<VoiceMicButton> createState() => _VoiceMicButtonState();
}

class _VoiceMicButtonState extends State<VoiceMicButton> {
  final VoiceAssistantService _voiceService = VoiceAssistantService();
  bool _isListening = false;
  String _lastWords = "";

  @override
  void initState() {
    super.initState();
    _voiceService.initVoice(context);
  }

void _toggleListening() {
  if (_isListening) {
    _voiceService.stopListening();
    setState(() => _isListening = false);
  } else {
    setState(() => _isListening = true);
    _voiceService.startListening(
      context: context,
      onResult: (text) {
        setState(() => _lastWords = text);
      },
      onListeningStateChanged: (isListening) {
        setState(() => _isListening = isListening);
      },
    );
  }
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
            child: Text(_lastWords, style: const TextStyle(color: Colors.white)),
          ),
        AvatarGlow(
          animate: _isListening,
          glowColor: Colors.blue,
          duration: const Duration(milliseconds: 2000),
          repeat: true,
          child: FloatingActionButton(
            onPressed: _toggleListening,
            backgroundColor: Colors.blue,
            child: Icon(_isListening ? Icons.mic : Icons.mic_none, size: 30),
          ),
        ),
      ],
    );
  }
}