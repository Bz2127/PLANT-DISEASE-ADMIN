import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart'; // 1. Import Supabase
import 'core/routing/app_router.dart';
import 'core/api/dio_client.dart';
import 'l10n/app_localizations.dart';

void main() async {
  // Ensures Flutter framework services are ready before initializing external APIs
  WidgetsFlutterBinding.ensureInitialized();
  
  // 2. Initialize Supabase with your project credentials
  await Supabase.initialize(
    url: 'https://gasnoxduzjqgnvmzsrki.supabase.co',
    anonKey: 'sb_publishable_1hoS1unpBpVvXSG229jjUw_dQMsM7MZ', 
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