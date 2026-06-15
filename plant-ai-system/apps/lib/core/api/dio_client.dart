import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

class DioClient {
  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'https://plant-disease-backend-yr3j.onrender.com/api', 
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
      responseType: ResponseType.json,
    ),
  );

  static void init() {
    _dio.interceptors.add(PrettyDioLogger(
      requestHeader: true,
      requestBody: true,
      responseBody: true,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        
        final token = prefs.getString('auth_token'); 
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
       final appLang = prefs.getString('user_lang') == 'Amharic' ? 'am' : 'en';
        
        options.queryParameters['lang'] = appLang;

        return handler.next(options);
      },
    ));
  }

  static Dio get instance => _dio;

  Future<List<dynamic>> getNotifications() async {
     final response = await _dio.get('/admin/notifications');

    if (response.statusCode == 200) {
      return response.data['data'];
    } else {
      throw Exception('Failed to load notifications');
    }
  }
}