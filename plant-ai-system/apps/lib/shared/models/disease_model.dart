// plant-ai-system/apps/lib/shared/models/disease_model.dart

class DiseaseResult {
  final String id;
  final String nameEn;
  final String nameAm;
  final double confidence;
  final String treatmentOrganic;
  final String treatmentChemical;
  final String prevention;

  DiseaseResult({
    required this.id,
    required this.nameEn,
    required this.nameAm,
    required this.confidence,
    required this.treatmentOrganic,
    required this.treatmentChemical,
    required this.prevention,
  });

  // Automatically parses incoming payload mappings directly from your scanController
  factory DiseaseResult.fromJson(Map<String, dynamic> json) {
    return DiseaseResult(
      id: json['id']?.toString() ?? '',
      nameEn: json['nameEn'] ?? json['diseaseName'] ?? 'Unknown Disease',
      nameAm: json['nameAm'] ?? json['diseaseNameAm'] ?? 'ያልታወቀ በሽታ',
      // Safely handles both integers (1) or floats (0.92) returned from the ML parser
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      treatmentOrganic: json['treatmentOrganic'] ?? json['organicTreatment'] ?? 'No organic treatment specified.',
      treatmentChemical: json['treatmentChemical'] ?? json['chemicalTreatment'] ?? 'No chemical treatment specified.',
      prevention: json['prevention'] ?? 'No prevention guidelines provided.',
    );
  }
}