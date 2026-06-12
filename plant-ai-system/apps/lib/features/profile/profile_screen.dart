import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isAmharic = false;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  
  String _selectedLocation = "Oromia";
  String _selectedLanguage = "English";
  String? _profileImageUrl;
  File? _imageFile;

  final List<String> _regions = ["Oromia", "Amhara", "SNNPR", "Tigray", "Sidama", "Afar", "Somali", "Addis Ababa"];
  final List<String> _languages = ["English", "Amharic"];

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _nameController.text = prefs.getString('user_name') ?? "";
      _phoneController.text = prefs.getString('user_phone') ?? "";
      _profileImageUrl = prefs.getString('user_profile_image');
      
      String savedLoc = prefs.getString('user_location') ?? "Oromia";
      if (_regions.contains(savedLoc)) _selectedLocation = savedLoc;

      String savedLang = prefs.getString('user_lang') ?? "English";
      if (_languages.contains(savedLang)) _selectedLanguage = savedLang;
      _isAmharic = (_selectedLanguage == 'Amharic');
      _isLoading = false;
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    // Clear out user session states safely
    await prefs.remove('user_name');
    await prefs.remove('user_phone');
    await prefs.remove('user_location');
    await prefs.remove('user_lang');
    await prefs.remove('user_profile_image');

    if (mounted) {
      // Safely navigate back to your application login route using GoRouter
      context.go('/login');
    }
  }

 Future<void> _saveProfileData() async {
  if (_nameController.text.trim().isEmpty || _phoneController.text.trim().isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(_isAmharic ? "እባክዎን ሁሉንም መስኮች ይሙሉ" : "Please fill all required fields")),
    );
    return;
  }

  setState(() => _isSaving = true);
  final prefs = await SharedPreferences.getInstance();

  try {
    final url = Uri.parse('https://plant-disease-backend-yr3j.onrender.com/api/users/profile-update');
    var request = http.MultipartRequest('POST', url);

    // These keys now match your server.js (req.body) expectations
    request.fields['phone_number'] = _phoneController.text.trim();
    request.fields['full_name'] = _nameController.text.trim();
    request.fields['location'] = _selectedLocation;       // Changed from 
    request.fields['language_pref'] = _selectedLanguage; // Changed from app_localization

    if (_imageFile != null) {
      request.files.add(await http.MultipartFile.fromPath(
        'image',
        _imageFile!.path,
        contentType: MediaType('image', 'jpeg'),
      ));
    }

    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final resData = json.decode(response.body);
      String? newImgUrl = resData['user']['profile_image'];

      await prefs.setString('user_name', _nameController.text.trim());
      await prefs.setString('user_phone', _phoneController.text.trim());
      await prefs.setString('user_location', _selectedLocation);
      await prefs.setString('user_lang', _selectedLanguage);
      if (newImgUrl != null) {
        await prefs.setString('user_profile_image', newImgUrl);
      }

      setState(() {
        _isAmharic = (_selectedLanguage == 'Amharic');
        if (newImgUrl != null) _profileImageUrl = newImgUrl;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF4CAF50),
            content: Text(_isAmharic ? "መገለጫዎ በተሳካ ሁኔታ ተቀይሯል" : "Profile updated successfully!"),
          ),
        );
      }
    } else {
      throw Exception("Server Error: ${response.statusCode}");
    }
  } catch (e) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFB38B4D),
          content: Text(_isAmharic ? "የመረቡ ግንኙነት አልተሳካም" : "Network error. Please try again."),
        ),
      );
    }
  } finally {
    setState(() => _isSaving = false);
  }
}
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0D1B12),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF4CAF50))),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B12),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1B3022),
        elevation: 0,
        // ✅ Added back navigation arrow using GoRouter context.pop()
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            }
          },
        ),
        title: Text(
          _isAmharic ? "የእኔ መገለጫ" : "My Profile", 
          style: GoogleFonts.notoSans(color: Colors.white, fontWeight: FontWeight.bold)
        ),
        // ✅ Added Trailing Logout action button
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            tooltip: _isAmharic ? "ውጣ" : "Logout",
            onPressed: _handleLogout,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            GestureDetector(
              onTap: _pickImage,
              child: CircleAvatar(
                radius: 55,
                backgroundColor: const Color(0xFF1B3022),
                backgroundImage: _imageFile != null 
                    ? FileImage(_imageFile!) 
                    : (_profileImageUrl != null ? NetworkImage('https://plant-disease-backend-yr3j.onrender.com$_profileImageUrl') : null) as ImageProvider?,
                child: (_imageFile == null && _profileImageUrl == null)
                    ? const Icon(Icons.camera_alt, size: 40, color: Color(0xFF4CAF50))
                    : null,
              ),
            ),
            const SizedBox(height: 25),
            _buildInputField(labelEn: "Full Name", labelAm: "ሙሉ ስም", icon: Icons.person_outline, controller: _nameController),
            const SizedBox(height: 15),
            _buildInputField(labelEn: "Phone Number", labelAm: "ስልክ ቁጥር", icon: Icons.phone_outlined, controller: _phoneController, keyboardType: TextInputType.phone),
            const SizedBox(height: 15),
            _buildDropdownField(labelEn: "Location", labelAm: "አካባቢ", icon: Icons.location_on_outlined, value: _selectedLocation, items: _regions, onChanged: (val) => setState(() => _selectedLocation = val!)),
            const SizedBox(height: 15),
            _buildDropdownField(labelEn: "Language", labelAm: "ቋንቋ", icon: Icons.translate_outlined, value: _selectedLanguage, items: _languages, onChanged: (val) => setState(() => _selectedLanguage = val!)),
            const SizedBox(height: 35),
            WidgetKeyframeButton(isSaving: _isSaving, isAmharic: _isAmharic, onSave: _saveProfileData),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField({required String labelEn, required String labelAm, required IconData icon, required TextEditingController controller, TextInputType keyboardType = TextInputType.text}) {
    return Container(
      decoration: BoxDecoration(color: const Color(0xFF1B3022), borderRadius: BorderRadius.circular(15)),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: _isAmharic ? labelAm : labelEn,
          labelStyle: const TextStyle(color: Colors.grey),
          prefixIcon: Icon(icon, color: const Color(0xFF4CAF50)),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildDropdownField({required String labelEn, required String labelAm, required IconData icon, required String value, required List<String> items, required ValueChanged<String?> onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(color: const Color(0xFF1B3022), borderRadius: BorderRadius.circular(15)),
      child: DropdownButtonFormField<String>(
        value: value,
        dropdownColor: const Color(0xFF1B3022),
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(labelText: _isAmharic ? labelAm : labelEn, labelStyle: const TextStyle(color: Colors.grey), prefixIcon: Icon(icon, color: const Color(0xFF4CAF50)), border: InputBorder.none),
        items: items.map((String item) => DropdownMenuItem<String>(value: item, child: Text(item))).toList(),
        onChanged: onChanged,
      ),
    );
  }
}

class WidgetKeyframeButton extends StatelessWidget {
  final bool isSaving;
  final bool isAmharic;
  final VoidCallback onSave;

  const WidgetKeyframeButton({
    super.key, 
    required this.isSaving, 
    required this.isAmharic, 
    required this.onSave
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: isSaving ? null : onSave,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF4CAF50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))
        ),
        child: isSaving 
          ? const CircularProgressIndicator(color: Colors.white)
          : Text(isAmharic ? "ለውጦችን አስቀምጥ" : "Save Changes", style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
    );
  }
}