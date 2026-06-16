import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:farmer_mobile_app/features/auth/auth_service.dart';
import 'package:farmer_mobile_app/features/voice/voice_assistant_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final VoiceAssistantService _voiceService = VoiceAssistantService();
  final AuthService _authService = AuthService();

  final _formKey = GlobalKey<FormState>();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  bool _isLoading = false;
  bool _otpSent = false;

  @override
  void initState() {
    super.initState();
    _initAndPlayInstruction();
  }

  Future<void> _initAndPlayInstruction() async {
    if (kIsWeb) return;

    try {
      await _voiceService.initVoice(context);
      await _voiceService.speak("እባክዎ ስልክ ቁጥር ያስገቡ።");
      await _voiceService.speak("Please enter your phone number.");
    } catch (_) {}
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final phone = _phoneController.text.trim();
    final success = await _authService.sendOtp(phone);

    if (!mounted) return;

    setState(() {
      _isLoading = false;
      _otpSent = success;
    });

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("OTP failed to send")),
      );
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.trim().isEmpty) return;

    setState(() => _isLoading = true);

    final success = await _authService.verifyOtp(_otpController.text.trim());

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (success) {
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Invalid OTP")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(30),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  const Icon(Icons.lock_outline, color: Color(0xFF4CAF50), size: 80),
                  const SizedBox(height: 20),

                  Text(
                    "Login",
                    style: GoogleFonts.notoSans(
                      fontSize: 28,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 40),

                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.phone, color: Color(0xFF4CAF50)),
                      hintText: "09... or 07...",
                      filled: true,
                      fillColor: const Color(0xFF1B3022),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return "Enter phone number";
                      }
                      final regExp = RegExp(r'^(09|07)\d{8}$');
                      if (!regExp.hasMatch(value.trim())) {
                        return "Invalid phone number";
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 20),

                  if (_otpSent)
                    TextFormField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.lock, color: Color(0xFF4CAF50)),
                        hintText: "Enter OTP",
                        filled: true,
                        fillColor: const Color(0xFF1B3022),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(15),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),

                  const SizedBox(height: 40),

                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4CAF50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      onPressed: _isLoading
                          ? null
                          : (_otpSent ? _verifyOtp : _sendOtp),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              _otpSent ? "VERIFY OTP" : "SEND OTP",
                              style: const TextStyle(fontSize: 18),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }
}