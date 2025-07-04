
interface TestTranscript {
  id: string;
  content: string;
  patientId: string;
  sessionId: string;
  timestamp: Date;
  metadata: {
    duration: number;
    wordCount: number;
    confidence: number;
  };
}

interface PipelineResult {
  transcriptId: string;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    triggered: boolean;
    confidence: number;
  }>;
  insights: Array<{
    id: string;
    title: string;
    riskLevel: string;
    category: string;
    confidence: number;
  }>;
  nlpOutput: any;
  processingTime: number;
  timestamp: Date;
}

interface AnalyticsData {
  totalTranscripts: number;
  alertsTriggered: number;
  insightsGenerated: number;
  averageProcessingTime: number;
  alertAccuracy: number;
  mostCommonAlertTypes: Array<{ type: string; count: number }>;
  riskLevelDistribution: Array<{ level: string; count: number }>;
}

class DataPipelineService {
  private testTranscripts: TestTranscript[] = [
    {
      id: 'test-1',
      content: 'Patient presents with blood pressure 180/95, currently on metoprolol 50mg twice daily. Reports chest pain and shortness of breath. Glucose level is 220 mg/dL despite being on metformin.',
      patientId: 'patient-001',
      sessionId: 'session-001',
      timestamp: new Date(),
      metadata: {
        duration: 45,
        wordCount: 32,
        confidence: 0.92
      }
    },
    {
      id: 'test-2', 
      content: 'Patient allergic to penicillin, now presenting with infection. Considering amoxicillin treatment. Patient also reports taking warfarin and asking about aspirin for headache.',
      patientId: 'patient-002',
      sessionId: 'session-002', 
      timestamp: new Date(),
      metadata: {
        duration: 38,
        wordCount: 25,
        confidence: 0.88
      }
    },
    {
      id: 'test-3',
      content: 'Elderly patient with sepsis indicators - fever 102.5F, elevated white blood cell count, altered mental status. Blood cultures pending. Patient appears to be in septic shock.',
      patientId: 'patient-003',
      sessionId: 'session-003',
      timestamp: new Date(),
      metadata: {
        duration: 52,
        wordCount: 28,
        confidence: 0.94
      }
    }
  ];

  private pipelineResults: PipelineResult[] = [];

  async runPipelineTest(transcriptId?: string): Promise<PipelineResult[]> {
    const transcriptsToTest = transcriptId 
      ? this.testTranscripts.filter(t => t.id === transcriptId)
      : this.testTranscripts;

    const results: PipelineResult[] = [];

    for (const transcript of transcriptsToTest) {
      const startTime = Date.now();
      
      // Simulate pipeline processing
      const result = await this.processTranscript(transcript);
      result.processingTime = Date.now() - startTime;
      
      results.push(result);
      this.pipelineResults.push(result);
    }

    return results;
  }

  private async processTranscript(transcript: TestTranscript): Promise<PipelineResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock alert detection
    const alerts = this.mockAlertDetection(transcript.content);
    
    // Mock insight generation
    const insights = this.mockInsightGeneration(transcript.content);
    
    // Mock NLP processing
    const nlpOutput = this.mockNLPProcessing(transcript.content);

    return {
      transcriptId: transcript.id,
      alerts,
      insights,
      nlpOutput,
      processingTime: 0, // Will be set by caller
      timestamp: new Date()
    };
  }

  private mockAlertDetection(content: string): PipelineResult['alerts'] {
    const alerts = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('sepsis') || lowerContent.includes('septic shock')) {
      alerts.push({
        id: `alert-sepsis-${Date.now()}`,
        type: 'sepsis',
        severity: 'critical',
        triggered: true,
        confidence: 0.89
      });
    }

    if (lowerContent.includes('allerg') && (lowerContent.includes('penicillin') || lowerContent.includes('amoxicillin'))) {
      alerts.push({
        id: `alert-allergy-${Date.now()}`,
        type: 'allergy',
        severity: 'critical', 
        triggered: true,
        confidence: 0.95
      });
    }

    if (lowerContent.includes('warfarin') && lowerContent.includes('aspirin')) {
      alerts.push({
        id: `alert-interaction-${Date.now()}`,
        type: 'medication_conflict',
        severity: 'critical',
        triggered: true,
        confidence: 0.87
      });
    }

    return alerts;
  }

  private mockInsightGeneration(content: string): PipelineResult['insights'] {
    const insights = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('blood pressure') || lowerContent.includes('hypertension')) {
      insights.push({
        id: `insight-bp-${Date.now()}`,
        title: 'Uncontrolled Hypertension',
        riskLevel: 'high',
        category: 'vitals',
        confidence: 0.82
      });
    }

    if (lowerContent.includes('glucose') || lowerContent.includes('diabetes')) {
      insights.push({
        id: `insight-diabetes-${Date.now()}`,
        title: 'Diabetes Management Concern',
        riskLevel: 'moderate',
        category: 'medication',
        confidence: 0.78
      });
    }

    return insights;
  }

  private mockNLPProcessing(content: string): any {
    return {
      entities: [
        { text: 'metoprolol', label: 'MEDICATION', confidence: 0.94 },
        { text: 'blood pressure', label: 'VITAL_SIGN', confidence: 0.91 },
        { text: 'chest pain', label: 'SYMPTOM', confidence: 0.88 }
      ],
      sentiment: 'clinical',
      urgency: 'high',
      summary: content.substring(0, 100) + '...'
    };
  }

  getAnalytics(): AnalyticsData {
    const results = this.pipelineResults;
    
    if (results.length === 0) {
      return {
        totalTranscripts: 0,
        alertsTriggered: 0,
        insightsGenerated: 0,
        averageProcessingTime: 0,
        alertAccuracy: 0,
        mostCommonAlertTypes: [],
        riskLevelDistribution: []
      };
    }

    const totalAlerts = results.reduce((sum, r) => sum + r.alerts.length, 0);
    const totalInsights = results.reduce((sum, r) => sum + r.insights.length, 0);
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    // Calculate alert type distribution
    const alertTypes: { [key: string]: number } = {};
    results.forEach(result => {
      result.alerts.forEach(alert => {
        alertTypes[alert.type] = (alertTypes[alert.type] || 0) + 1;
      });
    });

    const mostCommonAlertTypes = Object.entries(alertTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate risk level distribution
    const riskLevels: { [key: string]: number } = {};
    results.forEach(result => {
      result.insights.forEach(insight => {
        riskLevels[insight.riskLevel] = (riskLevels[insight.riskLevel] || 0) + 1;
      });
    });

    const riskLevelDistribution = Object.entries(riskLevels)
      .map(([level, count]) => ({ level, count }));

    return {
      totalTranscripts: results.length,
      alertsTriggered: totalAlerts,
      insightsGenerated: totalInsights,
      averageProcessingTime: Math.round(avgProcessingTime),
      alertAccuracy: 0.85, // Mock accuracy
      mostCommonAlertTypes,
      riskLevelDistribution
    };
  }

  exportToAirtable(data: any): Promise<boolean> {
    // Mock Airtable export
    console.log('Exporting to Airtable:', data);
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1000);
    });
  }

  exportToFirestore(data: any): Promise<boolean> {
    // Mock Firestore export
    console.log('Exporting to Firestore:', data);
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1000);
    });
  }

  exportResults(format: 'csv' | 'json' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      analytics: this.getAnalytics(),
      results: this.pipelineResults,
      testTranscripts: this.testTranscripts
    }, null, 2);
  }

  private exportToCSV(): string {
    const headers = [
      'Transcript ID',
      'Patient ID', 
      'Alerts Count',
      'Insights Count',
      'Processing Time (ms)',
      'Timestamp'
    ];
    
    const rows = this.pipelineResults.map(result => {
      const transcript = this.testTranscripts.find(t => t.id === result.transcriptId);
      return [
        result.transcriptId,
        transcript?.patientId || 'N/A',
        result.alerts.length,
        result.insights.length,
        result.processingTime,
        result.timestamp.toISOString()
      ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getTestTranscripts(): TestTranscript[] {
    return this.testTranscripts;
  }

  addTestTranscript(transcript: Omit<TestTranscript, 'id' | 'timestamp'>): void {
    const newTranscript: TestTranscript = {
      ...transcript,
      id: `test-${Date.now()}`,
      timestamp: new Date()
    };
    this.testTranscripts.push(newTranscript);
  }
}

export const dataPipelineService = new DataPipelineService();
export type { TestTranscript, PipelineResult, AnalyticsData };
