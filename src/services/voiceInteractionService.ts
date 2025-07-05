interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: Date;
  confidence: number;
  isInterim: boolean;
  speaker?: string;
  speakerId?: number;
  formattedTime?: string;
  clinicalTerms?: ClinicalTerm[];
}

interface ClinicalTerm {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'medication' | 'condition' | 'procedure' | 'abbreviation';
  externalUrl?: string;
  confidence: number;
}

interface MicrophoneState {
  status: 'idle' | 'listening' | 'processing' | 'muted' | 'error';
  isRecording: boolean;
  volume: number;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new() => SpeechRecognition;
    webkitSpeechRecognition?: new() => SpeechRecognition;
  }
}

class VoiceInteractionService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;
  private callbacks: {
    onTranscript?: (segment: TranscriptSegment) => void;
    onStatusChange?: (state: MicrophoneState) => void;
    onCommand?: (command: string) => void;
  } = {};
  
  private currentState: MicrophoneState = {
    status: 'idle',
    isRecording: false,
    volume: 0
  };

  private transcriptHistory: TranscriptSegment[] = [];
  private lastTranscriptTime: Date = new Date();
  private speakerCounter = 0;
  private lastSpeaker: string | null = null;

  // Clinical terms dictionary for highlighting
  private clinicalDictionary = {
    medications: [
      { term: 'warfarin', url: 'https://www.drugs.com/warfarin.html' },
      { term: 'xarelto', url: 'https://www.drugs.com/xarelto.html' },
      { term: 'metformin', url: 'https://www.drugs.com/metformin.html' },
      { term: 'lantus', url: 'https://www.drugs.com/lantus.html' },
      { term: 'insulin glargine', url: 'https://www.drugs.com/lantus.html' },
      { term: 'aspirin', url: 'https://www.drugs.com/aspirin.html' },
      { term: 'lisinopril', url: 'https://www.drugs.com/lisinopril.html' },
      { term: 'atorvastatin', url: 'https://www.drugs.com/lipitor.html' },
      { term: 'metoprolol', url: 'https://www.drugs.com/metoprolol.html' }
    ],
    conditions: [
      { term: 'chf', url: 'https://www.mayoclinic.org/diseases-conditions/heart-failure/symptoms-causes/syc-20373142' },
      { term: 'chronic heart failure', url: 'https://www.mayoclinic.org/diseases-conditions/heart-failure/symptoms-causes/syc-20373142' },
      { term: 'htn', url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/symptoms-causes/syc-20373410' },
      { term: 'hypertension', url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/symptoms-causes/syc-20373410' },
      { term: 'diabetes', url: 'https://www.mayoclinic.org/diseases-conditions/diabetes/symptoms-causes/syc-20371444' },
      { term: 'copd', url: 'https://www.mayoclinic.org/diseases-conditions/copd/symptoms-causes/syc-20353679' }
    ],
    abbreviations: [
      { term: 'pt', url: 'https://www.mayoclinic.org/tests-procedures/prothrombin-time/about/pac-20384661' },
      { term: 'bp', url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/in-depth/blood-pressure/art-20050982' },
      { term: 'hr', url: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979' },
      { term: 'rr', url: 'https://www.healthline.com/health/normal-respiratory-rate' }
    ]
  };

  constructor() {
    this.checkSupport();
    this.setupRecognition();
  }

  private checkSupport() {
    this.isSupported = !!(window.webkitSpeechRecognition || window.SpeechRecognition);
  }

  private setupRecognition() {
    if (!this.isSupported) return;

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;
    
    this.recognition = new SpeechRecognitionConstructor();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.updateState({ status: 'listening', isRecording: true });
    };

    this.recognition.onresult = (event) => {
      this.updateState({ status: 'processing' });
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        
        if (transcript) {
          const formattedTime = this.formatTimestamp(new Date());
          const speakerInfo = this.assignSpeaker(transcript);
          const clinicalTerms = this.detectClinicalTerms(transcript);

          const segment: TranscriptSegment = {
            id: `segment-${Date.now()}-${i}`,
            text: transcript,
            timestamp: new Date(),
            confidence: result[0].confidence || 0.9,
            isInterim: !result.isFinal,
            speaker: speakerInfo.speaker,
            speakerId: speakerInfo.speakerId,
            formattedTime,
            clinicalTerms
          };

          // Check for voice commands
          this.processVoiceCommands(transcript);
          
          // Add to history if final and merge with previous if same speaker
          if (result.isFinal) {
            this.addToHistoryWithMerging(segment);
            this.lastTranscriptTime = new Date();
          }

          this.callbacks.onTranscript?.(segment);
        }
      }
      
      this.updateState({ status: 'listening' });
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.updateState({ status: 'error', isRecording: false });
    };

    this.recognition.onend = () => {
      this.updateState({ status: 'idle', isRecording: false });
    };
  }

  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  private assignSpeaker(transcript: string): { speaker: string; speakerId: number } {
    // Simple speaker detection based on content patterns
    const lowerTranscript = transcript.toLowerCase();
    
    // Doctor indicators
    if (lowerTranscript.includes('prescribe') || lowerTranscript.includes('diagnosis') || 
        lowerTranscript.includes('examine') || lowerTranscript.includes('recommend')) {
      return { speaker: 'Doctor', speakerId: 0 };
    }
    
    // Patient indicators
    if (lowerTranscript.includes('i feel') || lowerTranscript.includes('my pain') || 
        lowerTranscript.includes('i have') || lowerTranscript.includes('i am')) {
      return { speaker: 'Patient', speakerId: 1 };
    }
    
    // Nurse indicators
    if (lowerTranscript.includes('vital signs') || lowerTranscript.includes('blood pressure') ||
        lowerTranscript.includes('temperature') || lowerTranscript.includes('medication time')) {
      return { speaker: 'Nurse', speakerId: 2 };
    }
    
    // Fallback: alternate between speakers or keep last speaker
    if (this.lastSpeaker === null) {
      this.lastSpeaker = 'Speaker_0';
      return { speaker: 'Speaker_0', speakerId: 0 };
    }
    
    return { speaker: this.lastSpeaker, speakerId: 0 };
  }

  private detectClinicalTerms(text: string): ClinicalTerm[] {
    const terms: ClinicalTerm[] = [];
    const lowerText = text.toLowerCase();

    // Check medications
    this.clinicalDictionary.medications.forEach(med => {
      const regex = new RegExp(`\\b${med.term.toLowerCase()}\\b`, 'gi');
      let match;
      while ((match = regex.exec(lowerText)) !== null) {
        terms.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          type: 'medication',
          externalUrl: med.url,
          confidence: 0.9
        });
      }
    });

    // Check conditions
    this.clinicalDictionary.conditions.forEach(condition => {
      const regex = new RegExp(`\\b${condition.term.toLowerCase()}\\b`, 'gi');
      let match;
      while ((match = regex.exec(lowerText)) !== null) {
        terms.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          type: 'condition',
          externalUrl: condition.url,
          confidence: 0.85
        });
      }
    });

    // Check abbreviations
    this.clinicalDictionary.abbreviations.forEach(abbr => {
      const regex = new RegExp(`\\b${abbr.term.toLowerCase()}\\b`, 'gi');
      let match;
      while ((match = regex.exec(lowerText)) !== null) {
        terms.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          type: 'abbreviation',
          externalUrl: abbr.url,
          confidence: 0.7
        });
      }
    });

    return terms.sort((a, b) => a.startIndex - b.startIndex);
  }

  private addToHistoryWithMerging(segment: TranscriptSegment) {
    const lastSegment = this.transcriptHistory[this.transcriptHistory.length - 1];
    
    // Merge with previous if same speaker and within 1 second
    if (lastSegment && 
        lastSegment.speaker === segment.speaker &&
        (segment.timestamp.getTime() - lastSegment.timestamp.getTime()) < 1000) {
      
      // Merge the segments
      lastSegment.text += ` ${segment.text}`;
      lastSegment.clinicalTerms = this.detectClinicalTerms(lastSegment.text);
      lastSegment.timestamp = segment.timestamp;
    } else {
      this.transcriptHistory.push(segment);
    }
  }

  private processVoiceCommands(transcript: string) {
    const commands = this.getVoiceCommands();
    const lowerTranscript = transcript.toLowerCase();
    
    for (const cmd of commands) {
      if (lowerTranscript.includes(cmd.command.toLowerCase())) {
        this.callbacks.onCommand?.(cmd.command);
        cmd.action();
        break;
      }
    }
  }

  private updateState(updates: Partial<MicrophoneState>) {
    this.currentState = { ...this.currentState, ...updates };
    this.callbacks.onStatusChange?.(this.currentState);
  }

  startListening() {
    if (!this.isSupported || !this.recognition) {
      this.updateState({ status: 'error' });
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.updateState({ status: 'error' });
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  pauseListening() {
    this.stopListening();
    this.updateState({ status: 'muted' });
  }

  resumeListening() {
    this.startListening();
  }

  repeatLastTranscript(): TranscriptSegment | null {
    const lastFinal = this.transcriptHistory
      .filter(segment => !segment.isInterim)
      .slice(-1)[0];
    
    if (lastFinal && this.callbacks.onTranscript) {
      // Re-emit the last transcript for UI to highlight
      this.callbacks.onTranscript({
        ...lastFinal,
        id: `repeat-${Date.now()}`,
        timestamp: new Date()
      });
    }
    
    return lastFinal || null;
  }

  getVoiceCommands(): VoiceCommand[] {
    return [
      {
        command: "repeat that",
        action: () => this.repeatLastTranscript(),
        description: "Replay the last transcript segment"
      },
      {
        command: "pause listening",
        action: () => this.pauseListening(),
        description: "Temporarily disable microphone"
      },
      {
        command: "resume listening",
        action: () => this.resumeListening(),
        description: "Re-enable microphone"
      },
      {
        command: "clear transcript",
        action: () => this.clearHistory(),
        description: "Clear transcript history"
      }
    ];
  }

  clearHistory() {
    this.transcriptHistory = [];
  }

  getTranscriptHistory(): TranscriptSegment[] {
    return [...this.transcriptHistory];
  }

  getCurrentState(): MicrophoneState {
    return { ...this.currentState };
  }

  isWebSpeechSupported(): boolean {
    return this.isSupported;
  }

  setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // QA Testing methods
  runAccuracyTest(testPhrases: string[]): Promise<{ phrase: string; accuracy: number; detected: string }[]> {
    return new Promise((resolve) => {
      const results: { phrase: string; accuracy: number; detected: string }[] = [];
      
      // Simulate accuracy testing
      testPhrases.forEach(phrase => {
        const detected = this.simulateTranscription(phrase);
        const accuracy = this.calculateAccuracy(phrase, detected);
        results.push({ phrase, accuracy, detected });
      });
      
      resolve(results);
    });
  }

  private simulateTranscription(originalPhrase: string): string {
    // Simulate some common transcription errors
    let result = originalPhrase.toLowerCase();
    
    // Common medication name errors
    result = result.replace(/xarelto/g, Math.random() > 0.1 ? 'xarelto' : 'zarelto');
    result = result.replace(/warfarin/g, Math.random() > 0.05 ? 'warfarin' : 'warpharin');
    result = result.replace(/metformin/g, Math.random() > 0.08 ? 'metformin' : 'metformil');
    
    // Abbreviation errors
    result = result.replace(/\bpt\b/g, Math.random() > 0.25 ? 'pt' : 'pee tee');
    result = result.replace(/\bhtn\b/g, Math.random() > 0.3 ? 'htn' : 'h t n');
    
    return result;
  }

  private calculateAccuracy(original: string, detected: string): number {
    const originalWords = original.toLowerCase().split(' ');
    const detectedWords = detected.toLowerCase().split(' ');
    
    let matches = 0;
    const maxLength = Math.max(originalWords.length, detectedWords.length);
    
    for (let i = 0; i < Math.min(originalWords.length, detectedWords.length); i++) {
      if (originalWords[i] === detectedWords[i]) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }
}

export const voiceInteractionService = new VoiceInteractionService();
export type { VoiceCommand, TranscriptSegment, MicrophoneState, ClinicalTerm };
