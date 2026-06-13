import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:typed_data';
import 'dart:io' show File;
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/api/dio_client.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class DetectionScreen extends StatefulWidget {
  const DetectionScreen({super.key});

  @override
  State<DetectionScreen> createState() => _DetectionScreenState();
}

class _DetectionScreenState extends State<DetectionScreen> {
  XFile? _pickedFile;
  Uint8List? _webImageBytes;
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;
  String _statusMessage = "Analyzing..."; 

  Future<void> _pickImage(ImageSource source) async {
    if (_isProcessing) return;

    try {
      setState(() => _isProcessing = true);
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1080,
        maxHeight: 1080,
        imageQuality: 70,
      );

      if (pickedFile != null) {
        if (kIsWeb) {
          final bytes = await pickedFile.readAsBytes();
          setState(() {
            _webImageBytes = bytes;
            _pickedFile = pickedFile;
          });
        } else {
          setState(() => _pickedFile = pickedFile);
        }
        await _proceedToAnalysis(pickedFile);
      } else {
        setState(() => _isProcessing = false);
      }
    } catch (e) {
      debugPrint("Error picking image: $e");
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _proceedToAnalysis(XFile fileToAnalyze) async {
    if (fileToAnalyze.path.isEmpty) return;

    setState(() => _statusMessage = "Uploading image...");

    try {
      Position? position;
      try {
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
          position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.medium);
        }
      } catch (e) {
        debugPrint("Location error: $e");
      }

      final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
      final fileBytes = await fileToAnalyze.readAsBytes();

      await Supabase.instance.client.storage
          .from('scan-images')
          .uploadBinary(fileName, fileBytes);

      final imageUrl = Supabase.instance.client.storage
          .from('scan-images')
          .getPublicUrl(fileName);

      setState(() => _statusMessage = "AI model is waking up, please wait...");

      FormData formData = FormData.fromMap({
        'image_url': imageUrl,
        'latitude': position?.latitude?.toString(),
        'longitude': position?.longitude?.toString(),
      });

      final response = await DioClient.instance.post(
        '/scans/predict-disease',
        data: formData,
        options: Options(receiveTimeout: const Duration(seconds: 90)),
      );

      if (response.statusCode == 200 && response.data != null && mounted) {
        setState(() {
          _pickedFile = null;
          _webImageBytes = null;
        });

        context.push('/result', extra: {
          'imageUrl': imageUrl,
          'analysisData': response.data,
        });
      }
    } catch (e) {
      debugPrint("Analysis Error: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to analyze. Please try again.")),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text("Scan Plant / ተክል ምርመራ"),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: _isProcessing
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const CircularProgressIndicator(color: Colors.green),
                        const SizedBox(height: 20),
                        Text(_statusMessage, style: const TextStyle(color: Colors.white)),
                      ],
                    ),
                  )
                : _pickedFile != null
                    ? (kIsWeb
                        ? Image.memory(_webImageBytes!, fit: BoxFit.contain)
                        : Image.file(File(_pickedFile!.path), fit: BoxFit.contain))
                    : Center(
                        child: Icon(
                          Icons.camera_enhance,
                          size: 100,
                          color: Colors.green.withOpacity(0.5),
                        ),
                      ),
          ),
          Container(
            padding: const EdgeInsets.all(40),
            color: const Color(0xFF0D1B12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _actionCircle(Icons.photo_library, () => _pickImage(ImageSource.gallery)),
                _actionCircle(Icons.camera_alt, () => _pickImage(ImageSource.camera), isLarge: true),
                _actionCircle(Icons.flash_on, () {}),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionCircle(IconData icon, VoidCallback onTap, {bool isLarge = false}) {
    return GestureDetector(
      onTap: _isProcessing ? null : onTap,
      child: CircleAvatar(
        radius: isLarge ? 40 : 30,
        backgroundColor: isLarge ? Colors.green : Colors.white10,
        child: Icon(icon, color: Colors.white, size: isLarge ? 40 : 25),
      ),
    );
  }
}