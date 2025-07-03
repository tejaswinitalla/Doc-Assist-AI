import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff, 
  Users, 
  Activity, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  X 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nlpService, NLPResponse } from '../services/nlpService';

interface TranscriptEntry {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: string;
  speakers?: Array<{
    word: string;
    speaker: number;
    startTime: string;
    endTime: string;
  }>;
}

const EnhancedTranscriptWidget: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [nlpResponse, setNlpResponse] = useState<NLPResponse | null>(null);
  const [isProcessingNLP, setIsProcessingNLP] = useState(false);
  const [nlpError, setNlpError] = useState<string | null>(null);
  const [showMedicationAlert, setShowMedicationAlert] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-process NLP when we have enough transcript content
    const fullTranscript = transcripts.map(t => t.text).join(' ');
    if (fullTranscript.length > 50 && !isProcessingNLP) {
      processWithNLP(fullTranscript);
    }
  }, [transcripts]);

  const connectWebSocket = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      wsRef.current = new WebSocket('ws://localhost:8080');
      
      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        console.log('Connected to ASR server');
        resolve();
      };
      
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleTranscript(message);
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        console.log('Disconnected from ASR server');
        
        // Auto-reconnect after 3 seconds if we were recording
        if (isRecording) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket().catch(console.error);
          }, 3000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        reject(error);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  };

  const handleTranscript = (message: any) => {
    if (message.type === 'transcript') {
      const { text, isFinal, confidence, speakers: speakerData } = message.data;
      
      if (isFinal) {
        const newTranscript: TranscriptEntry = {
          text,
          isFinal: true,
          confidence,
          timestamp: new Date().toLocaleTimeString(),
          speakers: speakerData
        };
        
        setTranscripts(prev => [...prev, newTranscript]);
        setCurrentTranscript('');
      } else {
        setCurrentTranscript(text);
      }
    }
  };

  const processWithNLP = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsProcessingNLP(true);
    setNlpError(null);
    
    try {
      console.log('Processing transcript with NLP:', transcript.substring(0, 100) + '...');
      
      // Use mock service for demo (switch to real service when Docker is available)
      const response = await nlpService.mockComposeDraftNote(transcript);
      
      setNlpResponse(response);
      
      // Check for medication alerts
      if (response.medicationRequests && response.medicationRequests.length > 0) {
        setShowMedicationAlert(true);
        toast({
          title: "Medication Alert",
          description: `${response.medicationRequests.length} medication(s) detected in transcript`,
        });
      }
      
      setRetryCount(0);
      
    } catch (error) {
      console.error('NLP processing error:', error);
      setNlpError(error instanceof Error ? error.message : 'NLP processing failed');
      
      toast({
        title: "NLP Processing Error",
        description: "Failed to process transcript. You can retry manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingNLP(false);
    }
  };

  const retryNLPProcessing = () => {
    const fullTranscript = transcripts.map(t => t.text).join(' ');
    setRetryCount(prev => prev + 1);
    processWithNLP(fullTranscript);
  };

  const startRecording = async () => {
    try {
      // First, get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Then connect to WebSocket
      await connectWebSocket();

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            wsRef.current?.send(JSON.stringify({
              type: 'audio',
              audio: base64Audio
            }));
          };
          reader.readAsDataURL(event.data);
        }
      };

      // Start recording
      wsRef.current?.send(JSON.stringify({ type: 'start' }));
      mediaRecorderRef.current.start(100);
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Microphone is now active and transcribing speech.",
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start audio recording. Please check microphone permissions and WebSocket server.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      wsRef.current?.send(JSON.stringify({ type: 'stop' }));
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      toast({
        title: "Recording Stopped",
        description: "Audio recording has been stopped.",
      });
    }
  };

  const formatFHIRJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  const getSpeakerColor = (speakerTag: number) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800'];
    return colors[speakerTag % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Medication Alert Banner */}
      {showMedicationAlert && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800">
              <strong>Medication Detected:</strong> {nlpResponse?.medicationRequests.length} medication request(s) identified in transcript
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMedicationAlert(false)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* NLP Error Banner */}
      {nlpError && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-orange-800">
              <strong>NLP Processing Failed:</strong> {nlpError}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={retryNLPProcessing}
              disabled={isProcessingNLP}
              className="text-orange-600 hover:text-orange-800"
            >
              {isProcessingNLP ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry {retryCount > 0 && `(${retryCount})`}
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="transcript" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transcript">Live Transcript</TabsTrigger>
          <TabsTrigger value="fhir" disabled={!nlpResponse}>
            FHIR Draft Note {nlpResponse && <Badge className="ml-2">Ready</Badge>}
          </TabsTrigger>
          <TabsTrigger value="alerts" disabled={!nlpResponse?.medicationRequests.length}>
            Alerts {nlpResponse?.medicationRequests.length ? <Badge variant="destructive" className="ml-2">{nlpResponse.medicationRequests.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-medical-blue" />
                  <span>Live Medical Transcription</span>
                </span>
                <div className="flex items-center space-x-2">
                  <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
                    {connectionStatus}
                  </Badge>
                  {isProcessingNLP && (
                    <Badge variant="outline" className="text-medical-teal">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Processing NLP
                    </Badge>
                  )}
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? 'destructive' : 'default'}
                    size="sm"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTranscript && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm text-yellow-800 font-medium">Interim: </span>
                  <span className="text-yellow-900">{currentTranscript}</span>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transcripts.map((transcript, index) => (
                  <div key={index} className="p-4 bg-white border rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{transcript.timestamp}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Confidence: {Math.round((transcript.confidence || 0) * 100)}%
                        </Badge>
                        {transcript.speakers && transcript.speakers.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {new Set(transcript.speakers.map(s => s.speaker)).size} speakers
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-900 mb-2">{transcript.text}</p>
                    
                    {transcript.speakers && transcript.speakers.length > 0 && (
                      <div className="space-y-1">
                        {Object.entries(
                          transcript.speakers.reduce((acc: any, word) => {
                            if (!acc[word.speaker]) acc[word.speaker] = [];
                            acc[word.speaker].push(word.word);
                            return acc;
                          }, {})
                        ).map(([speaker, words]: [string, any]) => (
                          <div key={speaker} className="flex items-center space-x-2">
                            <Badge className={`text-xs ${getSpeakerColor(parseInt(speaker))}`}>
                              Speaker {speaker}
                            </Badge>
                            <span className="text-sm text-gray-600">{words.join(' ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {transcripts.length === 0 && !currentTranscript && (
                <div className="text-center py-8 text-gray-500">
                  <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Click "Start Recording" to begin transcription</p>
                  <p className="text-sm mt-2">NLP processing will start automatically</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fhir">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-medical-success" />
                <span>FHIR Composition Draft</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nlpResponse ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Document Info</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p><strong>Type:</strong> {nlpResponse.composition.type.coding[0].display}</p>
                        <p><strong>Status:</strong> {nlpResponse.composition.status}</p>
                        <p><strong>Date:</strong> {new Date(nlpResponse.composition.date).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sections</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>{nlpResponse.composition.section.length} sections identified</p>
                        <ul className="mt-2 space-y-1">
                          {nlpResponse.composition.section.map((section, idx) => (
                            <li key={idx} className="text-xs text-gray-600">• {section.title}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Extracted Entities</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p><strong>Medications:</strong> {nlpResponse.medicationRequests.length}</p>
                        <p><strong>Encounters:</strong> {nlpResponse.encounters.length}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Full FHIR JSON:</h4>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-96">
                      <code>{formatFHIRJson(nlpResponse.composition)}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Start recording to generate FHIR draft note</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <span>Clinical Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nlpResponse?.medicationRequests.length ? (
                <div className="space-y-4">
                  {nlpResponse.medicationRequests.map((med, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold text-red-800">Medication Request Detected</p>
                          <p><strong>Medication:</strong> {med.medicationCodeableConcept.text}</p>
                          <p><strong>Status:</strong> {med.status}</p>
                          {med.dosageInstruction && med.dosageInstruction[0] && (
                            <p><strong>Dosage:</strong> {med.dosageInstruction[0].text}</p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No clinical alerts detected</p>
                  <p className="text-sm mt-2">Alerts will appear when medications or critical findings are identified</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTranscriptWidget;
