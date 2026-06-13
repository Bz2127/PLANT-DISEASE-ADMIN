import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart'; // Added for security
import 'core/routing/app_router.dart';
import 'core/api/dio_client.dart';
import 'l10n/app_localizations.dart';

void main() async {
  // Ensures Flutter framework services are ready before initializing external APIs
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables from a .env file
  await dotenv.load(fileName: ".env");

  // 2. Initialize Supabase using environment variables
  await Supabase.initialize(
    url: dotenv.get('SUPABASE_URL'),
    anonKey: dotenv.get('SUPABASE_ANON_KEY'), 
  );

  DioClient.init();
  
  runApp(const KareApp());
}

class KareApp extends StatelessWidget {
  const KareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'KARE AI',
      routerConfig: AppRouter.router,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0D1B12),
        textTheme: GoogleFonts.notoSansTextTheme(ThemeData.dark().textTheme),
      ),
    );
  }
}