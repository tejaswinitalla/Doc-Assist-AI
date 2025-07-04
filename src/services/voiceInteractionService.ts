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
          const segment: TranscriptSegment = {
            id: `segment-${Date.now()}-${i}`,
            text: transcript,
            timestamp: new Date(),
            confidence: result[0].confidence || 0.9,
            isInterim: !result.isFinal
          };

          // Check for voice commands
          this.processVoiceCommands(transcript);
          
          // Add to history if final
          if (result.isFinal) {
            this.transcriptHistory.push(segment);
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
}

export const voiceInteractionService = new VoiceInteractionService();
export type { VoiceCommand, TranscriptSegment, MicrophoneState };
