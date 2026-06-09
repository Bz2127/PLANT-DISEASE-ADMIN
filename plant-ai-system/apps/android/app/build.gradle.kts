plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.plantai.system.farmer_mobile_app"
    // Force SDK 35 to support the new CameraX libraries
    compileSdk = 36 
    ndkVersion = flutter.ndkVersion

    compileOptions {
        // UPGRADED TO JAVA 17 (Required by modern Android libraries)
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        // UPGRADED TO JAVA 17
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.plantai.system.farmer_mobile_app"
        
        // CameraX 1.6.0 works best with minSdk 23+ (Android 6.0+)
        minSdk = flutter.minSdkVersion 
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}

// ✅ THE CRITICAL FIX FOR YOUR ERROR:
// This adds the missing internal library that the Camera plugin forgot to include.
dependencies {
    implementation("androidx.concurrent:concurrent-futures:1.2.0")
}
