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
    // Terminal Request Logger
    _dio.interceptors.add(PrettyDioLogger(
      requestHeader: true,
      requestBody: true,
      responseBody: true,
    ));

    // Automated Token & Language Injector Interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        
        // 1. Authenticated Auth Session Management
        final token = prefs.getString('auth_token'); 
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        // 2. Automated Bilingual Matrix Context Injector
        // Default to 'en' if the user hasn't explicitly picked a language yet
        final appLang = prefs.getString('selected_language') ?? 'en'; 
        
        // Automatically append ?lang=am or ?lang=en to every backend endpoint context
        options.queryParameters['lang'] = appLang;

        return handler.next(options);
      },
    ));
  }

  static Dio get instance => _dio;
}