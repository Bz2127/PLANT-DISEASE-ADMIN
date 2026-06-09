import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart'; // <--- ADD THIS IMPORT
import '../../../core/api/dio_client.dart';

class AuthService {

  final Dio _dio = DioClient.instance;

  String _formatPhoneNumber(String rawPhone) {
    String formatted = rawPhone.trim();
    if (formatted.startsWith('0') && formatted.length == 10) {
      return '+251${formatted.substring(1)}';
    }
    return formatted;
  }

  Future<bool> login(String phone, String password) async {
    try {
      final String standardizedPhone = _formatPhoneNumber(phone);

      final response = await _dio.post(
        '/users/login',
        data: {
          'phone_number': standardizedPhone,
          'password': password.isEmpty ? null : password,
        },
      );

      if (response.data != null && response.data['token'] != null) {
        final prefs = await SharedPreferences.getInstance();
        
        final String token = response.data['token'];
        final Map<String, dynamic> user = response.data['user'] ?? {};

        await prefs.setString('auth_token', token);
        await prefs.setString('user_id', user['id']?.toString() ?? '');
        await prefs.setString('user_name', user['full_name'] ?? 'Farmer');
        
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Login Error: $e');
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String phone,
    String password = '',
    String location = '',
  }) async {
    try {
      final String standardizedPhone = _formatPhoneNumber(phone);

      final response = await _dio.post(
        '/users/register',
        data: {
          'full_name': name,
          'full_name_am': name,
          'phone_number': standardizedPhone,
          'location': location,
          'password': password.isEmpty ? null : password,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return await login(standardizedPhone, password);
      }
      return false;
    } catch (e) {
      debugPrint('Registration Error: $e');
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}