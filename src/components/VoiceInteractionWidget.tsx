import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  MicOff, 
  Activity, 
  FileText, 
  AlertTriangle, 
  Volume2,
  RefreshCw,
  Download,
  Trash2,
  Users,
  Shield,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MicrophoneIndicator from './MicrophoneIndicator';
import ClinicalAlertCard from './ClinicalAlertCard';
import SpeakerAwareTranscript from './SpeakerAwareTranscript';
import ConsentManagement from './ConsentManagement';
import ASRQualityTester from './ASRQualityTester';
import { voiceInteractionService, TranscriptSegment, MicrophoneState } from '../services/voiceInteractionService';
import { clinicalAlertService, ClinicalAlert } from '../services/clinicalAlertService';
import { nlpService, NLPResponse } from '../services/nlpService';

// Extended interface for speaker-aware transcripts
interface SpeakerTranscript {
  id: string;
  text: string;
  speaker: 'doctor' | 'patient' | 'nurse' | 'unknown';
  timestamp: Date;
  confidence: number;
}

const VoiceInteractionWidget: React.FC = () => {
  const [micState, setMicState] = useState<MicrophoneState>({
    status: 'idle',
    isRecording: false,
    volume: 0
  });
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [speakerTranscripts, setSpeakerTranscripts] = useState<SpeakerTranscript[]>([]);
  const [currentInterim, setCurrentInterim] = useState<string>('');
  const [clinicalAlerts, setClinicalAlerts] = useState<ClinicalAlert[]>([]);
  const [nlpResponse, setNlpResponse] = useState<NLPResponse | null>(null);
  const [isProcessingNLP, setIsProcessingNLP] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isWebSpeechSupported] = useState(voiceInteractionService.isWebSpeechSupported());
  const [showInsights, setShowInsights] = useState(false);
  
  const { toast } = useToast();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up voice interaction callbacks
    voiceInteractionService.setCallbacks({
      onTranscript: handleNewTranscript,
      onStatusChange: setMicState,
      onCommand: handleVoiceCommand
    });

    // Set up clinical alert callbacks
    clinicalAlertService.setCallbacks({
      onNewAlert: handleNewAlert,
      onAlertUpdate: handleAlertUpdate
    });

    return () => {
      voiceInteractionService.stopListening();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new transcript arrives
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptSegments, currentInterim]);

  useEffect(() => {
    // Auto-process NLP when we have enough transcript content
    const fullTranscript = transcriptSegments
      .filter(segment => !segment.isInterim)
      .map(segment => segment.text)
      .join(' ');
    
    if (fullTranscript.length > 50 && !isProcessingNLP) {
      processWithNLP(fullTranscript);
    }
  }, [transcriptSegments]);

  // Simple speaker diarization simulation
  const simulateSpeakerDiarization = (text: string): 'doctor' | 'patient' | 'nurse' | 'unknown' => {
    const lowerText = text.toLowerCase();
    
    // Doctor indicators
    if (lowerText.includes('prescribe') || lowerText.includes('diagnosis') || 
        lowerText.includes('examine') || lowerText.includes('recommend')) {
      return 'doctor';
    }
    
    // Patient indicators
    if (lowerText.includes('i feel') || lowerText.includes('my pain') || 
        lowerText.includes('i have') || lowerText.includes('i am')) {
      return 'patient';
    }
    
    // Nurse indicators
    if (lowerText.includes('vital signs') || lowerText.includes('blood pressure') ||
        lowerText.includes('temperature') || lowerText.includes('medication time')) {
      return 'nurse';
    }
    
    // Default to unknown if no clear indicators
    return 'unknown';
  };

  const handleNewTranscript = (segment: TranscriptSegment) => {
    if (segment.isInterim) {
      setCurrentInterim(segment.text);
    } else {
      setTranscriptSegments(prev => [...prev, segment]);
      setCurrentInterim('');
      
      // Create speaker-aware transcript
      const speakerTranscript: SpeakerTranscript = {
        id: segment.id,
        text: segment.text,
        speaker: simulateSpeakerDiarization(segment.text),
        timestamp: segment.timestamp,
        confidence: segment.confidence
      };
      setSpeakerTranscripts(prev => [...prev, speakerTranscript]);
      
      // Enhanced alert analysis with context
      import('../services/enhancedClinicalAlertService').then(({ enhancedClinicalAlertService }) => {
        const patientContext = {
          activeMedications: [
            { name: 'warfarin', status: 'active' as const, prescribedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), category: 'anticoagulant' },
            { name: 'aspirin', status: 'active' as const, prescribedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), category: 'antiplatelet' }
          ],
          activeConditions: [
            { code: 'I10', display: 'hypertension', clinicalStatus: 'active' as const, onsetDate: new Date('2023-01-15') },
            { code: 'E11', display: 'type 2 diabetes', clinicalStatus: 'active' as const }
          ],
          recentVitals: [],
          allergies: []
        };
        
        const enhancedAlerts = enhancedClinicalAlertService.analyzeWithContext(
          segment.text, 
          patientContext
        );
        
        // Convert enhanced alerts to standard format for display
        enhancedAlerts.forEach(alert => {
          const standardAlert = {
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            source: alert.source,
            sourceUrl: alert.sourceUrl,
            detectedPhrase: alert.detectedPhrase,
            timestamp: alert.timestamp,
            context: alert.context,
            isAcknowledged: alert.isAcknowledged,
            isOverridden: alert.isOverridden,
            userResponse: alert.userResponse
          };
          
          setClinicalAlerts(prev => [standardAlert, ...prev]);
          
          toast({
            title: `${alert.priority === 'critical' ? '🚨' : '⚠️'} Enhanced Clinical Alert`,
            description: alert.message,
            variant: alert.priority === 'critical' ? "destructive" : "default",
          });
        });
      });
      
      // Generate insights if we have enough context
      if (transcriptSegments.length > 2) {
        const fullTranscript = [...transcriptSegments, segment]
          .map(s => s.text)
          .join(' ');
        
        import('../services/aiInsightsService').then(({ aiInsightsService }) => {
          const insights = aiInsightsService.generateInsightCards(
            fullTranscript, 
            clinicalAlertService.getActiveAlerts(),
            nlpResponse
          );
          
          if (insights.length > 0) {
            setShowInsights(true);
            toast({
              title: "Enhanced Insights Available",
              description: `Generated ${insights.length} contextual clinical insights`,
            });
          }
        });
      }
    }
  };

  const handleVoiceCommand = (command: string) => {
    setLastCommand(command);
    toast({
      title: "Voice Command Detected",
      description: `Executed: "${command}"`,
    });
  };

  const handleNewAlert = (alert: ClinicalAlert) => {
    setClinicalAlerts(prev => [alert, ...prev]);
    
    toast({
      title: `${alert.severity === 'critical' ? '🚨' : '⚠️'} Clinical Alert`,
      description: alert.message,
      variant: alert.severity === 'critical' ? "destructive" : "default",
    });
  };

  const handleAlertUpdate = (updatedAlert: ClinicalAlert) => {
    setClinicalAlerts(prev => 
      prev.map(alert => alert.id === updatedAlert.id ? updatedAlert : alert)
    );
  };

  const processWithNLP = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsProcessingNLP(true);
    
    try {
      const response = await nlpService.mockComposeDraftNote(transcript);
      setNlpResponse(response);
      
      toast({
        title: "NLP Processing Complete",
        description: "FHIR document generated successfully",
      });
      
    } catch (error) {
      console.error('NLP processing error:', error);
      toast({
        title: "NLP Processing Failed",
        description: "Could not process transcript",
        variant: "destructive",
      });
    } finally {
      setIsProcessingNLP(false);
    }
  };

  const startListening = () => {
    const success = voiceInteractionService.startListening();
    if (!success) {
      toast({
        title: "Microphone Error",
        description: isWebSpeechSupported 
          ? "Could not access microphone. Please check permissions." 
          : "Web Speech API not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    voiceInteractionService.stopListening();
  };

  const pauseListening = () => {
    voiceInteractionService.pauseListening();
    toast({
      title: "Microphone Paused",
      description: "Say 'resume listening' to continue",
    });
  };

  const addTestTranscript = () => {
    const testPhrases = [
      { text: "Patient reports chest pain and shortness of breath for the past two hours.", speaker: 'patient' as const },
      { text: "I'm prescribing aspirin 81mg daily and scheduling an ECG.", speaker: 'doctor' as const },
      { text: "Blood pressure is 140 over 90, heart rate 78, oxygen saturation 98 percent.", speaker: 'nurse' as const },
      { text: "Patient has a history of diabetes and hypertension.", speaker: 'doctor' as const },
      { text: "I feel dizzy when I stand up and have been having headaches.", speaker: 'patient' as const }
    ];
    
    const randomPhrase = testPhrases[Math.floor(Math.random() * testPhrases.length)];
    const testSegment: TranscriptSegment = {
      id: `test-${Date.now()}`,
      text: randomPhrase.text,
      timestamp: new Date(),
      confidence: 0.95,
      isInterim: false
    };
    
    const speakerTranscript: SpeakerTranscript = {
      id: testSegment.id,
      text: randomPhrase.text,
      speaker: randomPhrase.speaker,
      timestamp: new Date(),
      confidence: 0.95
    };
    
    setTranscriptSegments(prev => [...prev, testSegment]);
    setSpeakerTranscripts(prev => [...prev, speakerTranscript]);
    
    toast({
      title: "Test Data Added",
      description: "Sample clinical transcript with speaker identification",
    });
  };

  const clearAllData = () => {
    setTranscriptSegments([]);
    setSpeakerTranscripts([]);
    setCurrentInterim('');
    setClinicalAlerts([]);
    setNlpResponse(null);
    clinicalAlertService.clearAlerts();
    voiceInteractionService.clearHistory();
    
    toast({
      title: "Data Cleared",
      description: "All transcripts and alerts have been cleared",
    });
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      transcripts: transcriptSegments,
      speakerTranscripts: speakerTranscripts,
      alerts: clinicalAlertService.exportAlertLog(),
      nlpResponse: nlpResponse
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Clinical session data downloaded successfully",
    });
  };

  const alertStats = clinicalAlertService.getAlertStats();

  return (
    <div className="space-y-6">
      {/* Status and Controls Header */}
      <Card className="border-medical-blue-light">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-medical-blue" />
              <span>Enhanced Voice Clinical Assistant</span>
              <MicrophoneIndicator state={micState} />
            </div>
            <div className="flex items-center space-x-2">
              {alertStats.total > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {alertStats.critical} Critical, {alertStats.caution} Caution
                </Badge>
              )}
              {isProcessingNLP && (
                <Badge variant="outline">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Processing NLP
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={micState.isRecording ? stopListening : startListening}
              variant={micState.isRecording ? 'destructive' : 'default'}
              disabled={!isWebSpeechSupported}
            >
              {micState.isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
            
            {micState.isRecording && (
              <Button onClick={pauseListening} variant="outline">
                Pause
              </Button>
            )}
            
            <Button onClick={addTestTranscript} variant="outline" size="sm">
              Add Test Data
            </Button>
            
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <Button onClick={clearAllData} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>

          {lastCommand && (
            <Alert className="border-blue-200 bg-blue-50">
              <Volume2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Last voice command: <strong>"{lastCommand}"</strong>
              </AlertDescription>
            </Alert>
          )}

          {!isWebSpeechSupported && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Web Speech API not supported. Voice features will be limited. Use Chrome/Edge for best experience.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="transcript" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="transcript">
            <Users className="w-4 h-4 mr-1" />
            Speaker Transcript {speakerTranscripts.length > 0 && `(${speakerTranscripts.length})`}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Enhanced Alerts {alertStats.total > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alertStats.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights">
            AI Insights {showInsights && <Badge className="ml-2">New</Badge>}
          </TabsTrigger>
          <TabsTrigger value="validation">
            <TestTube className="w-4 h-4 mr-1" />
            Pipeline Testing
          </TabsTrigger>
          <TabsTrigger value="consent">
            <Shield className="w-4 h-4 mr-1" />
            Consent
          </TabsTrigger>
          <TabsTrigger value="quality">
            ASR Testing
          </TabsTrigger>
          <TabsTrigger value="fhir" disabled={!nlpResponse}>
            FHIR Document {nlpResponse && <Badge className="ml-2">Ready</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          <SpeakerAwareTranscript 
            transcripts={speakerTranscripts}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Enhanced Clinical Safety Alerts</span>
                </div>
                <div className="text-sm text-gray-600">
                  {alertStats.total} active alerts with contextual filtering
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {clinicalAlerts.map(alert => (
                    <ClinicalAlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={(alertId) => clinicalAlertService.acknowledgeAlert(alertId)}
                      onOverride={(alertId, comment) => clinicalAlertService.overrideAlert(alertId, comment)}
                    />
                  ))}
                  
                  {clinicalAlerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No clinical alerts detected</p>
                      <p className="text-sm mt-2">
                        Enhanced alerts will appear when safety triggers are identified with proper context
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <React.Suspense fallback={<div>Loading enhanced insights...</div>}>
            <div className="min-h-96">
              {React.createElement(
                React.lazy(() => import('./InsightCardsDashboard')),
                {
                  transcript: transcriptSegments.map(s => s.text).join(' '),
                  alerts: clinicalAlerts,
                  nlpResponse: nlpResponse
                }
              )}
            </div>
          </React.Suspense>
        </TabsContent>

        <TabsContent value="validation">
          <React.Suspense fallback={<div>Loading AI pipeline validator...</div>}>
            {React.createElement(
              React.lazy(() => import('./AIPipelineValidator')),
              {}
            )}
          </React.Suspense>
        </TabsContent>

        <TabsContent value="consent">
          <ConsentManagement />
        </TabsContent>

        <TabsContent value="quality">
          <ASRQualityTester />
        </TabsContent>

        <TabsContent value="fhir">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-medical-success" />
                <span>FHIR Clinical Document</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nlpResponse ? (
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800">Document Type</h4>
                        <p className="text-sm text-blue-600">
                          {nlpResponse.composition.type.coding[0].display}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800">Status</h4>
                        <p className="text-sm text-green-600">
                          {nlpResponse.composition.status}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-800">Sections</h4>
                        <p className="text-sm text-purple-600">
                          {nlpResponse.composition.section.length} identified
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Complete FHIR JSON:</h4>
                      <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                        <code>{JSON.stringify(nlpResponse.composition, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>FHIR document will be generated from transcript</p>
                  <p className="text-sm mt-2">Start speaking to create clinical notes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceInteractionWidget;
