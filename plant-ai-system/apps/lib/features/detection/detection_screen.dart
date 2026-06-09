import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:typed_data';
import 'dart:io' show File, Directory;
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/api/dio_client.dart';

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
        await _proceedToAnalysis();
      } else {
        setState(() => _isProcessing = false);
      }
    } catch (e) {
      debugPrint("Error picking image: $e");
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _proceedToAnalysis() async {
    if (_pickedFile == null) return;

    setState(() => _isProcessing = true);

    try {
      Position? position;
      try {
        LocationPermission permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
          position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.medium);
        }
      } catch (e) {
        debugPrint("Location error: $e");
      }

      final Directory appDir = await getApplicationDocumentsDirectory();
      final String fileName = _pickedFile!.path.split('/').last;
      final File permanentFile = await File(_pickedFile!.path).copy('${appDir.path}/$fileName');

      FormData formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(permanentFile.path, filename: fileName),
        'latitude': position?.latitude.toString(),
        'longitude': position?.longitude.toString(),
      });

      final response = await DioClient.instance.post(
        '/scans/predict-disease',
        data: formData,
      );

      if (response.statusCode == 200 && mounted) {
        context.push('/result', extra: permanentFile.path);
      }
    } catch (e) {
      debugPrint("Analysis Error: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to analyze. Please try again.")),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
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
                ? const Center(child: CircularProgressIndicator(color: Colors.green))
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