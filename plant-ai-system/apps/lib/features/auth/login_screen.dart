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
  final TextEditingController _passwordController = TextEditingController();
  
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _initAndPlayInstruction();
  }

  Future<void> _initAndPlayInstruction() async {
    if (kIsWeb) return; 

    try {
     await _voiceService.initVoice(context);
      await _voiceService.speak("እባክዎን ስልክ ቁጥርዎን ያስገቡ።");
      await _voiceService.speak("Please enter your phone number.");
    } catch (e) {
      print("TTS Speech engine safely bypassed on web channel: $e");
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    final String phone = _phoneController.text.trim();
    final String password = _passwordController.text;

    final bool isSuccess = await _authService.login(phone, password);

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (isSuccess) {
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text(
            "የስልክ ቁጥር ወይም የይለፍ ቃል ስህተት ነው።\nIncorrect phone number or password.",
            style: TextStyle(fontSize: 16),
          ),
        ),
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
            padding: const EdgeInsets.all(30.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.lock_outline,
                    color: Color(0xFF4CAF50),
                    size: 80,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "Login",
                    style: GoogleFonts.notoSans(
                      fontSize: 28,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    "ወደ መለያዎ ይግቡ",
                    style: TextStyle(color: Colors.grey, fontSize: 18),
                  ),
                  const SizedBox(height: 40),

                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    buildCounter: (context, {required currentLength, required isFocused, maxLength}) => null,
                    style: const TextStyle(color: Colors.white, fontSize: 18),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.phone, color: Color(0xFF4CAF50)),
                      hintText: "09... ወይም 07... (10 Digits)",
                      hintStyle: const TextStyle(color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF1B3022),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return "እባክዎን ስልክ ቁጥር ያስገቡ / Enter phone number";
                      }
                      final regExp = RegExp(r'^(09|07)\d{8}$');
                      if (!regExp.hasMatch(value.trim())) {
                        return "ልክ ያልሆነ ስልክ ቁጥር (Must be 10 digits starting with 09 or 07)";
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(color: Colors.white, fontSize: 18),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.vpn_key_outlined, color: Color(0xFF4CAF50)),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          color: Colors.grey,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      hintText: "Password (Optional for Passwordless Accounts)",
                      hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
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
                      onPressed: _isLoading ? null : _handleLogin,
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              "LOGIN / ግባ",
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  TextButton(
                    onPressed: () => context.push('/register'),
                    child: const Text(
                      "Don't have an account? Register here.\nመለያ የለዎትም? እዚህ ይመዝገቡ።",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFFB38B4D), fontSize: 14),
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
    _passwordController.dispose();
    super.dispose();
  }
}