import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:farmer_mobile_app/features/auth/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final AuthService _authService = AuthService();
  final _formKey = GlobalKey<FormState>();
  
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  
  bool _isLoading = false;

  Future<void> _handleRegistration() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    final String name = _nameController.text.trim();
    final String phone = _phoneController.text.trim();
    final String location = _locationController.text.trim();

    // ✅ FIXED: Actively passing the inputs down down your actual network stack
    final bool isSuccess = await _authService.register(
      name: name,
      phone: phone,
      location: location,
      password: '', // Passing empty to match passwordless account logic
    );

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
            "ምዝገባው አልተሳካም። እባክዎ እንደገና ይሞክሩ።\nRegistration failed. Please try again.",
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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(30),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Text(
                "Create Account",
                style: GoogleFonts.notoSans(
                  fontSize: 26,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Text(
                "አዲስ መለያ ይፍጠሩ",
                style: TextStyle(color: Colors.grey, fontSize: 18),
              ),
              const SizedBox(height: 40),

              _buildInputField(
                controller: _nameController,
                icon: Icons.person,
                hint: "Full Name / ሙሉ ስም",
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return "እባክዎን ሙሉ ስም ያስገቡ / Enter full name";
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              _buildInputField(
                controller: _phoneController,
                icon: Icons.phone,
                hint: "09... ወይም 07... (10 Digits)",
                keyboardType: TextInputType.phone,
                maxLength: 10,
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

              _buildInputField(
                controller: _locationController,
                icon: Icons.location_on,
                hint: "Region/City / ክልል ወይም ከተማ",
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return "እባክዎን ክልል ወይም ከተማ ያስገቡ / Enter location";
                  }
                  return null;
                },
              ),
              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFB38B4D),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                  onPressed: _isLoading ? null : _handleRegistration,
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          "REGISTER / ተመዝገብ",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required IconData icon,
    required String hint,
    required String? Function(String?) validator,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLength: maxLength,
      buildCounter: maxLength != null ? (context, {required currentLength, required isFocused, maxLength}) => null : null,
      style: const TextStyle(color: Colors.white),
      validator: validator,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: const Color(0xFF4CAF50)),
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.grey),
        filled: true,
        fillColor: const Color(0xFF1B3022),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _locationController.dispose();
    super.dispose();
  }
}