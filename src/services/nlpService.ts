
interface FHIRComposition {
  resourceType: string;
  id: string;
  status: string;
  type: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
  };
  date: string;
  author: Array<{
    reference: string;
  }>;
  title: string;
  section: Array<{
    title: string;
    code?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    entry?: Array<{
      reference: string;
      resource?: any;
    }>;
  }>;
}

interface NLPResponse {
  composition: FHIRComposition;
  medicationRequests: Array<{
    resourceType: string;
    id: string;
    status: string;
    medicationCodeableConcept: {
      text: string;
    };
    subject: {
      reference: string;
    };
    dosageInstruction?: Array<{
      text: string;
    }>;
  }>;
  encounters: Array<{
    resourceType: string;
    id: string;
    status: string;
    class: {
      code: string;
      display: string;
    };
  }>;
}

class NLPService {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = 'http://localhost:8081'; // NLP service Docker container
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async composeDraftNote(transcript: string): Promise<NLPResponse> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/nsp/draft-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript,
          patientId: 'patient-123',
          encounterId: 'encounter-456'
        }),
      });

      if (!response.ok) {
        throw new Error(`NLP Service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformResponse(data);
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  private transformResponse(rawData: any): NLPResponse {
    // Transform the NLP service response to our expected format
    const composition: FHIRComposition = rawData.composition || {
      resourceType: 'Composition',
      id: `comp-${Date.now()}`,
      status: 'preliminary',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '11506-3',
          display: 'Progress note'
        }]
      },
      subject: { reference: 'Patient/patient-123' },
      date: new Date().toISOString(),
      author: [{ reference: 'Practitioner/dr-smith' }],
      title: 'Clinical Progress Note',
      section: rawData.sections || []
    };

    return {
      composition,
      medicationRequests: rawData.medicationRequests || [],
      encounters: rawData.encounters || []
    };
  }

  // Mock method for testing without Docker container
  async mockComposeDraftNote(transcript: string): Promise<NLPResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const hasMedications = transcript.toLowerCase().includes('medication') || 
                          transcript.toLowerCase().includes('prescrib') ||
                          transcript.toLowerCase().includes('drug');

    return {
      composition: {
        resourceType: 'Composition',
        id: `comp-${Date.now()}`,
        status: 'preliminary',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '11506-3',
            display: 'Progress note'
          }]
        },
        subject: { reference: 'Patient/patient-123' },
        date: new Date().toISOString(),
        author: [{ reference: 'Practitioner/dr-smith' }],
        title: 'Clinical Progress Note',
        section: [
          {
            title: 'Chief Complaint',
            entry: [{
              reference: 'Observation/chief-complaint-1',
              resource: {
                valueString: transcript.substring(0, 100) + '...'
              }
            }]
          },
          {
            title: 'Assessment and Plan',
            entry: [{
              reference: 'ClinicalImpression/assessment-1',
              resource: {
                summary: 'Clinical assessment based on patient presentation'
              }
            }]
          }
        ]
      },
      medicationRequests: hasMedications ? [{
        resourceType: 'MedicationRequest',
        id: `med-req-${Date.now()}`,
        status: 'draft',
        medicationCodeableConcept: {
          text: 'Lisinopril 10mg daily'
        },
        subject: { reference: 'Patient/patient-123' },
        dosageInstruction: [{
          text: 'Take one tablet daily with food'
        }]
      }] : [],
      encounters: [{
        resourceType: 'Encounter',
        id: `enc-${Date.now()}`,
        status: 'in-progress',
        class: {
          code: 'AMB',
          display: 'Ambulatory'
        }
      }]
    };
  }
}

export const nlpService = new NLPService();
export type { FHIRComposition, NLPResponse };
