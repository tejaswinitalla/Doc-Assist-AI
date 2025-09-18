
interface ClinicalAlert {
  id: string;
  type: 'sepsis' | 'medication_conflict' | 'contraindication' | 'allergy' | 'dosage_error';
  severity: 'critical' | 'caution';
  message: string;
  source: string;
  sourceUrl?: string;
  detectedPhrase: string;
  timestamp: Date;
  context: string;
  isAcknowledged: boolean;
  isOverridden: boolean;
  userResponse?: {
    action: 'acknowledge' | 'override';
    comment?: string;
    timestamp: Date;
    userId?: string;
  };
}

interface AlertTrigger {
  keywords: string[];
  type: ClinicalAlert['type'];
  severity: ClinicalAlert['severity'];
  message: string;
  source: string;
  sourceUrl?: string;
}

class ClinicalAlertService {
  private alertTriggers: AlertTrigger[] = [
    {
      keywords: ['sepsis', 'septic shock', 'blood infection', 'systemic infection'],
      type: 'sepsis',
      severity: 'critical',
      message: 'Potential sepsis indicators detected. Consider immediate assessment and intervention.',
      source: 'NICE Guideline NG51',
      sourceUrl: 'https://www.nice.org.uk/guidance/ng51'
    },
    {
      keywords: ['contraindicated', 'contraindication', 'should not take', 'avoid with'],
      type: 'contraindication',
      severity: 'critical',
      message: 'Medication contraindication detected. Verify patient safety before proceeding.',
      source: 'BMJ Clinical Guidelines',
      sourceUrl: 'https://www.bmj.com/clinical-evidence'
    },
    {
      keywords: ['drug interaction', 'medication conflict', 'dangerous combination'],
      type: 'medication_conflict',
      severity: 'critical',
      message: 'Potential drug interaction identified. Review medication compatibility.',
      source: 'FDA Drug Interaction Database'
    },
    {
      keywords: ['allergic to', 'allergy', 'adverse reaction', 'allergic reaction'],
      type: 'allergy',
      severity: 'critical',
      message: 'Allergy alert triggered. Verify patient allergy status immediately.',
      source: 'Clinical Safety Guidelines'
    },
    {
      keywords: ['overdose', 'too much', 'exceeded dose', 'double dose', 'maximum dose'],
      type: 'dosage_error',
      severity: 'caution',
      message: 'Potential dosage concern detected. Verify medication amounts.',
      source: 'Pharmacy Guidelines'
    }
  ];

  private detectedAlerts: ClinicalAlert[] = [];
  private callbacks: {
    onNewAlert?: (alert: ClinicalAlert) => void;
    onAlertUpdate?: (alert: ClinicalAlert) => void;
  } = {};

  analyzeTranscript(transcript: string, context: string = ''): ClinicalAlert[] {
    const newAlerts: ClinicalAlert[] = [];
    const lowerTranscript = transcript.toLowerCase();

    for (const trigger of this.alertTriggers) {
      for (const keyword of trigger.keywords) {
        if (lowerTranscript.includes(keyword.toLowerCase())) {
          // Extract the sentence containing the trigger phrase
          const sentences = transcript.split(/[.!?]+/);
          const triggeredSentence = sentences.find(sentence => 
            sentence.toLowerCase().includes(keyword.toLowerCase())
          ) || transcript.substring(0, 100);

          const alert: ClinicalAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: trigger.type,
            severity: trigger.severity,
            message: trigger.message,
            source: trigger.source,
            sourceUrl: trigger.sourceUrl,
            detectedPhrase: keyword,
            timestamp: new Date(),
            context: context || triggeredSentence.trim(),
            isAcknowledged: false,
            isOverridden: false
          };

          // Avoid duplicate alerts for the same trigger in the same transcript
          const isDuplicate = this.detectedAlerts.some(existingAlert => 
            existingAlert.type === alert.type && 
            existingAlert.detectedPhrase === alert.detectedPhrase &&
            Math.abs(existingAlert.timestamp.getTime() - alert.timestamp.getTime()) < 30000 // 30 seconds
          );

          if (!isDuplicate) {
            newAlerts.push(alert);
            this.detectedAlerts.push(alert);
            this.callbacks.onNewAlert?.(alert);
          }
          
          break; // Only trigger once per alert type per analysis
        }
      }
    }

    return newAlerts;
  }

  acknowledgeAlert(alertId: string, userId?: string): boolean {
    const alert = this.detectedAlerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.isAcknowledged = true;
    alert.userResponse = {
      action: 'acknowledge',
      timestamp: new Date(),
      userId
    };

    this.callbacks.onAlertUpdate?.(alert);
    return true;
  }

  overrideAlert(alertId: string, comment: string, userId?: string): boolean {
    const alert = this.detectedAlerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.isOverridden = true;
    alert.userResponse = {
      action: 'override',
      comment,
      timestamp: new Date(),
      userId
    };

    this.callbacks.onAlertUpdate?.(alert);
    return true;
  }

  getActiveAlerts(): ClinicalAlert[] {
    return this.detectedAlerts.filter(alert => 
      !alert.isAcknowledged && !alert.isOverridden
    );
  }

  getAllAlerts(): ClinicalAlert[] {
    return [...this.detectedAlerts];
  }

  clearAlerts(): void {
    this.detectedAlerts = [];
  }

  getAlertStats(): { critical: number; caution: number; total: number } {
    const active = this.getActiveAlerts();
    return {
      critical: active.filter(a => a.severity === 'critical').length,
      caution: active.filter(a => a.severity === 'caution').length,
      total: active.length
    };
  }

  setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  exportAlertLog(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      alerts: this.detectedAlerts.map(alert => ({
        ...alert,
        timestamp: alert.timestamp.toISOString(),
        userResponse: alert.userResponse ? {
          ...alert.userResponse,
          timestamp: alert.userResponse.timestamp.toISOString()
        } : undefined
      }))
    }, null, 2);
  }
}

export const clinicalAlertService = new ClinicalAlertService();
export type { ClinicalAlert, AlertTrigger };
