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

  static bool _initialized = false;

  static void init() {
    if (_initialized) return;
    _initialized = true;

    _dio.interceptors.add(PrettyDioLogger(
      requestHeader: true,
      requestBody: true,
      responseBody: true,
    ));

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();

          final token = prefs.getString('auth_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          final langPref = prefs.getString('user_lang');
          final appLang = (langPref == 'Amharic') ? 'am' : 'en';

          options.queryParameters = {
            ...options.queryParameters,
            'lang': appLang,
          };

          return handler.next(options);
        },

        onError: (e, handler) async {
          if (e.response?.statusCode == 429) {
            await Future.delayed(const Duration(seconds: 3));
            try {
              final retryResponse = await _dio.fetch(e.requestOptions);
              return handler.resolve(retryResponse);
            } catch (_) {}
          }
          return handler.next(e);
        },
      ),
    );
  }

  static Dio get instance {
    init();
    return _dio;
  }

  Future<List<dynamic>> getNotifications() async {
    final response = await _dio.get('/admin/notifications');

    if (response.statusCode == 200) {
      return response.data['data'];
    } else {
      throw Exception('Failed to load notifications');
    }
  }
}