
interface InsightCard {
  id: string;
  title: string;
  summary: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  category: 'medication' | 'vitals' | 'diagnosis' | 'contraindication';
  source: {
    name: string;
    url?: string;
    type: 'guideline' | 'policy' | 'research';
  };
  triggers: string[];
  context: string;
  recommendations: string[];
  timestamp: Date;
  isActive: boolean;
  confidence: number;
}

interface MedicationContext {
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  category: string;
  dosage?: string;
  lastAdministered?: Date;
}

interface VitalsContext {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSat?: number;
  timestamp: Date;
}

interface AlertFilterCriteria {
  severityThreshold: 'low' | 'moderate' | 'high' | 'critical';
  medicationCategories: string[];
  vitalsRanges: {
    systolic?: { min: number; max: number };
    diastolic?: { min: number; max: number };
    heartRate?: { min: number; max: number };
  };
  requireActiveMedications: boolean;
}

class AIInsightsService {
  private insightCards: InsightCard[] = [];
  private medicationContext: MedicationContext[] = [];
  private vitalsContext: VitalsContext[] = [];
  private filterCriteria: AlertFilterCriteria = {
    severityThreshold: 'moderate',
    medicationCategories: ['anticoagulants', 'beta-blockers', 'ace-inhibitors'],
    vitalsRanges: {
      systolic: { min: 90, max: 140 },
      diastolic: { min: 60, max: 90 },
      heartRate: { min: 60, max: 100 }
    },
    requireActiveMedications: true
  };

  generateInsightCards(transcript: string, alerts: any[], nlpResponse?: any): InsightCard[] {
    const newInsights: InsightCard[] = [];

    // Analyze transcript for medication risks
    const medicationInsights = this.analyzeMedicationRisks(transcript, alerts);
    newInsights.push(...medicationInsights);

    // Analyze vital signs context
    const vitalsInsights = this.analyzeVitalsContext(transcript, alerts);
    newInsights.push(...vitalsInsights);

    // Generate diagnosis-based insights
    const diagnosisInsights = this.analyzeDiagnosisRisks(transcript, nlpResponse);
    newInsights.push(...diagnosisInsights);

    this.insightCards.push(...newInsights);
    return newInsights;
  }

  private analyzeMedicationRisks(transcript: string, alerts: any[]): InsightCard[] {
    const insights: InsightCard[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Check for uncontrolled diabetes
    if (lowerTranscript.includes('glucose') || lowerTranscript.includes('blood sugar') || lowerTranscript.includes('diabetes')) {
      const glucoseValues = this.extractNumericValues(transcript, ['glucose', 'blood sugar']);
      if (glucoseValues.some(val => val > 180)) {
        insights.push({
          id: `insight-diabetes-${Date.now()}`,
          title: 'Uncontrolled Diabetes Detected',
          summary: 'Elevated glucose levels indicate potential diabetes management issues requiring immediate attention.',
          riskLevel: 'high',
          category: 'diagnosis',
          source: {
            name: 'ADA Clinical Guidelines',
            url: 'https://diabetesjournals.org/care/article/46/Supplement_1/S1/148057/Introduction-and-Methodology-Standards-of-Care-in',
            type: 'guideline'
          },
          triggers: ['elevated glucose', 'diabetes mention'],
          context: transcript.substring(0, 200),
          recommendations: [
            'Review current diabetes medications',
            'Consider insulin adjustment',
            'Schedule endocrinology consultation'
          ],
          timestamp: new Date(),
          isActive: true,
          confidence: 0.85
        });
      }
    }

    // Check for cardiovascular risks
    if (lowerTranscript.includes('blood pressure') || lowerTranscript.includes('hypertension')) {
      const bpInsight = this.analyzeBPContext(transcript);
      if (bpInsight) insights.push(bpInsight);
    }

    return insights;
  }

  private analyzeBPContext(transcript: string): InsightCard | null {
    const activeBetaBlockers = this.medicationContext.filter(med => 
      med.status === 'active' && med.category.includes('beta-blocker')
    );

    const bpValues = this.extractBPValues(transcript);
    const highBP = bpValues.some(bp => bp.systolic > 140 || bp.diastolic > 90);

    if (highBP && activeBetaBlockers.length > 0) {
      return {
        id: `insight-bp-${Date.now()}`,
        title: 'Hypertension Despite Beta-Blocker Therapy',
        summary: 'Patient shows elevated BP readings while on active beta-blocker therapy, suggesting need for medication adjustment.',
        riskLevel: 'moderate',
        category: 'medication',
        source: {
          name: 'AHA/ACC Hypertension Guidelines',
          url: 'https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065',
          type: 'guideline'
        },
        triggers: ['elevated BP', 'active beta-blocker'],
        context: transcript.substring(0, 200),
        recommendations: [
          'Consider beta-blocker dose adjustment',
          'Evaluate medication adherence',
          'Add ACE inhibitor if not contraindicated'
        ],
        timestamp: new Date(),
        isActive: true,
        confidence: 0.78
      };
    }

    return null;
  }

  private analyzeVitalsContext(transcript: string, alerts: any[]): InsightCard[] {
    const insights: InsightCard[] = [];
    // Implementation for vitals-based insights
    return insights;
  }

  private analyzeDiagnosisRisks(transcript: string, nlpResponse?: any): InsightCard[] {
    const insights: InsightCard[] = [];
    // Implementation for diagnosis-based insights
    return insights;
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

  private extractBPValues(text: string): Array<{systolic: number, diastolic: number}> {
    const bpRegex = /(\d{2,3})\s*\/\s*(\d{2,3})/g;
    const matches = text.matchAll(bpRegex);
    const values = [];
    
    for (const match of matches) {
      const systolic = parseInt(match[1]);
      const diastolic = parseInt(match[2]);
      if (systolic > 70 && systolic < 250 && diastolic > 40 && diastolic < 150) {
        values.push({ systolic, diastolic });
      }
    }
    
    return values;
  }

  updateMedicationContext(medications: MedicationContext[]): void {
    this.medicationContext = medications;
  }

  updateVitalsContext(vitals: VitalsContext): void {
    this.vitalsContext.push(vitals);
  }

  setFilterCriteria(criteria: Partial<AlertFilterCriteria>): void {
    this.filterCriteria = { ...this.filterCriteria, ...criteria };
  }

  filterAlertsByCriteria(alerts: any[]): any[] {
    return alerts.filter(alert => {
      // Apply severity filtering
      const severityOrder = ['low', 'moderate', 'high', 'critical'];
      const alertSeverityIndex = severityOrder.indexOf(alert.severity);
      const thresholdIndex = severityOrder.indexOf(this.filterCriteria.severityThreshold);
      
      if (alertSeverityIndex < thresholdIndex) return false;

      // Apply medication context filtering
      if (this.filterCriteria.requireActiveMedications && alert.type === 'medication_conflict') {
        const hasActiveMeds = this.medicationContext.some(med => 
          med.status === 'active' && alert.context.toLowerCase().includes(med.name.toLowerCase())
        );
        if (!hasActiveMeds) return false;
      }

      return true;
    });
  }

  getInsightCards(filters?: { category?: string; riskLevel?: string }): InsightCard[] {
    let cards = this.insightCards.filter(card => card.isActive);
    
    if (filters?.category) {
      cards = cards.filter(card => card.category === filters.category);
    }
    
    if (filters?.riskLevel) {
      cards = cards.filter(card => card.riskLevel === filters.riskLevel);
    }
    
    return cards.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  dismissInsightCard(cardId: string): void {
    const card = this.insightCards.find(c => c.id === cardId);
    if (card) {
      card.isActive = false;
    }
  }

  exportInsights(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      filterCriteria: this.filterCriteria,
      insightCards: this.insightCards,
      medicationContext: this.medicationContext,
      vitalsContext: this.vitalsContext
    }, null, 2);
  }
}

export const aiInsightsService = new AIInsightsService();
export type { InsightCard, MedicationContext, VitalsContext, AlertFilterCriteria };
