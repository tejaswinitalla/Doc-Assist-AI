import { ClinicalAlert } from './clinicalAlertService';

interface EnhancedClinicalAlert extends ClinicalAlert {
  priority: 'critical' | 'warning' | 'info';
  contextualFactors: {
    activeMedications?: string[];
    activeConditions?: string[];
    vitalTrends?: VitalTrend[];
    timeframe?: string;
  };
  riskScore: number;
  actionRequired: boolean;
  suppressionRules?: {
    condition: string;
    reason: string;
  }[];
}

interface VitalTrend {
  parameter: string;
  value: number;
  timestamp: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface AlertThreshold {
  parameter: string;
  criticalValue: number;
  warningValue: number;
  contextRequirements?: string[];
  suppressionConditions?: string[];
}

interface PatientContext {
  activeMedications: Array<{
    name: string;
    status: 'active' | 'inactive' | 'suspended';
    prescribedDate: Date;
    category: string;
  }>;
  activeConditions: Array<{
    code: string;
    display: string;
    clinicalStatus: 'active' | 'resolved' | 'inactive';
    onsetDate?: Date;
  }>;
  recentVitals: VitalTrend[];
  allergies: Array<{
    substance: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
}

class EnhancedClinicalAlertService {
  private alertThresholds: AlertThreshold[] = [
    {
      parameter: 'blood_pressure_systolic',
      criticalValue: 180,
      warningValue: 160,
      contextRequirements: ['hypertension_diagnosis'],
      suppressionConditions: ['resolved_hypertension']
    },
    {
      parameter: 'blood_pressure_diastolic',
      criticalValue: 110,
      warningValue: 100,
      contextRequirements: ['hypertension_diagnosis']
    },
    {
      parameter: 'heart_rate',
      criticalValue: 120,
      warningValue: 100
    },
    {
      parameter: 'glucose',
      criticalValue: 250,
      warningValue: 180,
      contextRequirements: ['diabetes_diagnosis']
    }
  ];

  private drugInteractionMatrix = new Map([
    ['warfarin_aspirin', { severity: 'critical', description: 'Increased bleeding risk' }],
    ['ace_inhibitor_potassium', { severity: 'warning', description: 'Hyperkalemia risk' }],
    ['beta_blocker_calcium_channel', { severity: 'warning', description: 'Bradycardia risk' }]
  ]);

  analyzeWithContext(
    transcript: string, 
    patientContext: PatientContext
  ): EnhancedClinicalAlert[] {
    const alerts: EnhancedClinicalAlert[] = [];

    // 1. Analyze vital signs with context
    const vitalAlerts = this.analyzeVitalsWithContext(transcript, patientContext);
    alerts.push(...vitalAlerts);

    // 2. Check drug interactions for active medications only
    const drugAlerts = this.analyzeDrugInteractions(transcript, patientContext);
    alerts.push(...drugAlerts);

    // 3. Check condition-specific alerts
    const conditionAlerts = this.analyzeConditionAlerts(transcript, patientContext);
    alerts.push(...conditionAlerts);

    // 4. Apply suppression rules
    return this.applySuppression(alerts, patientContext);
  }

  private analyzeVitalsWithContext(
    transcript: string, 
    context: PatientContext
  ): EnhancedClinicalAlert[] {
    const alerts: EnhancedClinicalAlert[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Extract BP values
    const bpMatches = transcript.match(/(\d{2,3})\s*\/\s*(\d{2,3})/g);
    
    if (bpMatches) {
      bpMatches.forEach(bpReading => {
        const [systolic, diastolic] = bpReading.split('/').map(Number);
        
        // Check if patient has hypertension diagnosis
        const hasHypertension = context.activeConditions.some(
          condition => condition.display.toLowerCase().includes('hypertension') && 
          condition.clinicalStatus === 'active'
        );

        // Only alert if context requirements are met
        if (hasHypertension) {
          let priority: 'critical' | 'warning' | 'info' = 'info';
          let riskScore = 0;

          if (systolic >= 180 || diastolic >= 110) {
            priority = 'critical';
            riskScore = 0.9;
          } else if (systolic >= 160 || diastolic >= 100) {
            priority = 'warning';
            riskScore = 0.7;
          }

          if (priority !== 'info') {
            alerts.push({
              id: `bp-alert-${Date.now()}`,
              type: 'contraindication',
              severity: priority === 'critical' ? 'critical' : 'caution',
              priority,
              message: `Elevated blood pressure (${bpReading}) detected in hypertensive patient`,
              source: 'AHA/ACC Hypertension Guidelines',
              sourceUrl: 'https://www.ahajournals.org/hypertension-guidelines',
              detectedPhrase: bpReading,
              timestamp: new Date(),
              context: transcript.substring(0, 200),
              contextualFactors: {
                activeConditions: ['hypertension'],
                vitalTrends: context.recentVitals.filter(v => v.parameter.includes('blood_pressure'))
              },
              riskScore,
              actionRequired: priority === 'critical',
              isAcknowledged: false,
              isOverridden: false
            });
          }
        }
      });
    }

    return alerts;
  }

  private analyzeDrugInteractions(
    transcript: string, 
    context: PatientContext
  ): EnhancedClinicalAlert[] {
    const alerts: EnhancedClinicalAlert[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Get medications prescribed in the last 30 days
    const recentMedications = context.activeMedications.filter(med => {
      const daysSincePrescribed = (Date.now() - med.prescribedDate.getTime()) / (1000 * 60 * 60 * 24);
      return med.status === 'active' && daysSincePrescribed <= 30;
    });

    // Check for dangerous combinations
    const activeMedNames = recentMedications.map(med => med.name.toLowerCase());
    
    // Warfarin + Aspirin interaction
    if (activeMedNames.some(name => name.includes('warfarin')) && 
        activeMedNames.some(name => name.includes('aspirin'))) {
      
      alerts.push({
        id: `drug-interaction-${Date.now()}`,
        type: 'medication_conflict',
        severity: 'critical',
        priority: 'critical',
        message: 'Critical drug interaction: Warfarin + Aspirin increases bleeding risk significantly',
        source: 'FDA Drug Interaction Database',
        sourceUrl: undefined,
        detectedPhrase: 'warfarin aspirin combination',
        timestamp: new Date(),
        context: transcript.substring(0, 200),
        contextualFactors: {
          activeMedications: ['warfarin', 'aspirin'],
          timeframe: 'last 30 days'
        },
        riskScore: 0.95,
        actionRequired: true,
        isAcknowledged: false,
        isOverridden: false
      });
    }

    return alerts;
  }

  private analyzeConditionAlerts(
    transcript: string, 
    context: PatientContext
  ): EnhancedClinicalAlert[] {
    const alerts: EnhancedClinicalAlert[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Check for uncontrolled diabetes
    if (lowerTranscript.includes('hba1c') || lowerTranscript.includes('glucose')) {
      const hasDiabetes = context.activeConditions.some(
        condition => condition.display.toLowerCase().includes('diabetes') && 
        condition.clinicalStatus === 'active'
      );

      if (hasDiabetes) {
        const glucoseValues = this.extractNumericValues(transcript, ['glucose', 'hba1c']);
        const elevatedValues = glucoseValues.filter(val => val > 180);

        if (elevatedValues.length > 0) {
          alerts.push({
            id: `diabetes-alert-${Date.now()}`,
            type: 'contraindication',
            severity: 'critical',
            priority: 'critical',
            message: `Uncontrolled diabetes detected: Glucose ${elevatedValues[0]}mg/dL`,
            source: 'ADA Clinical Guidelines',
            sourceUrl: 'https://diabetesjournals.org/care',
            detectedPhrase: `glucose ${elevatedValues[0]}`,
            timestamp: new Date(),
            context: transcript.substring(0, 200),
            contextualFactors: {
              activeConditions: ['diabetes'],
              vitalTrends: context.recentVitals.filter(v => v.parameter === 'glucose')
            },
            riskScore: 0.85,
            actionRequired: true,
            isAcknowledged: false,
            isOverridden: false
          });
        }
      }
    }

    return alerts;
  }

  private applySuppression(
    alerts: EnhancedClinicalAlert[], 
    context: PatientContext
  ): EnhancedClinicalAlert[] {
    return alerts.filter(alert => {
      // Don't alert for resolved conditions
      if (alert.contextualFactors?.activeConditions) {
        const hasResolvedCondition = context.activeConditions.some(condition =>
          alert.contextualFactors?.activeConditions?.includes(condition.display.toLowerCase()) &&
          condition.clinicalStatus === 'resolved'
        );
        
        if (hasResolvedCondition) {
          alert.suppressionRules = [{
            condition: 'resolved_condition',
            reason: 'Alert suppressed due to resolved clinical condition'
          }];
          return false;
        }
      }

      // Don't alert for inactive medications
      if (alert.type === 'medication_conflict') {
        const hasInactiveMeds = context.activeMedications.some(med =>
          alert.contextualFactors?.activeMedications?.includes(med.name.toLowerCase()) &&
          med.status !== 'active'
        );
        
        if (hasInactiveMeds) {
          alert.suppressionRules = [{
            condition: 'inactive_medication',
            reason: 'Alert suppressed due to inactive medication status'
          }];
          return false;
        }
      }

      return true;
    });
  }

  private extractNumericValues(text: string, keywords: string[]): number[] {
    const values: number[] = [];
    const lowerText = text.toLowerCase();
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}[^\\d]*([\\d.]+)`, 'gi');
      const matches = lowerText.matchAll(regex);
      for (const match of matches) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) values.push(value);
      }
    });
    
    return values;
  }

  calculateMetrics(alerts: EnhancedClinicalAlert[], actualCases: any[]): {
    precision: number;
    recall: number;
    f1Score: number;
    coverage: number;
  } {
    const truePositives = alerts.filter(alert => 
      actualCases.some(actualCase => actualCase.type === alert.type)
    ).length;
    
    const falsePositives = alerts.length - truePositives;
    const falseNegatives = actualCases.length - truePositives;
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const coverage = truePositives / actualCases.length || 0;
    
    return { precision, recall, f1Score, coverage };
  }
}

export const enhancedClinicalAlertService = new EnhancedClinicalAlertService();
export type { EnhancedClinicalAlert, PatientContext, VitalTrend };
