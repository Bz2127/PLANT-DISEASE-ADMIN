import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';
import '../../../core/api/dio_client.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final Dio _dio = DioClient.instance;

  String? _verificationId;

  String _formatPhoneNumber(String rawPhone) {
    String formatted = rawPhone.trim();
    if (formatted.startsWith('0') && formatted.length == 10) {
      return '+251${formatted.substring(1)}';
    }
    return formatted;
  }

  Future<bool> sendOtp(String phone) async {
    try {
      final formattedPhone = _formatPhoneNumber(phone);

      await _auth.verifyPhoneNumber(
        phoneNumber: formattedPhone,
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _auth.signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          debugPrint(e.message);
        },
        codeSent: (String verificationId, int? resendToken) {
          _verificationId = verificationId;
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
      );

      return true;
    } catch (e) {
      debugPrint(e.toString());
      return false;
    }
  }

  Future<bool> verifyOtp(String otp) async {
    try {
      if (_verificationId == null) return false;

      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: otp,
      );

      final userCredential =
          await _auth.signInWithCredential(credential);

      final user = userCredential.user;
      if (user == null) return false;

      final prefs = await SharedPreferences.getInstance();

      final idToken = await user.getIdToken();

      final response = await _dio.post(
        '/users/firebase-login',
        data: {
          "firebase_token": idToken,
        },
      );

      if (response.data != null && response.data['token'] != null) {
        //await prefs.setString('auth_token', response.data['token']);

        final userData = response.data['user'];

        await prefs.setString('user_id', userData['id'].toString());
        await prefs.setString(
            'user_name', userData['full_name'] ?? 'Farmer');
        await prefs.setString(
            'language_pref', userData['language_pref'] ?? 'en');

        return true;
      }

      return false;
    } catch (e) {
      debugPrint(e.toString());
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String phone,
    required String location,
    required String password,
  }) async {
    try {
      final formattedPhone = _formatPhoneNumber(phone);

      final response = await _dio.post(
        '/users/register',
        data: {
          "full_name": name,
          "phone_number": formattedPhone,
          "location": location,
        },
      );

      if (response.data != null && response.data['user'] != null) {
        return true;
      }

      return false;
    } catch (e) {
      debugPrint(e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    await _auth.signOut();
  }
}