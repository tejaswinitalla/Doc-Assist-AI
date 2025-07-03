import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Terminal, FileText, Play, CheckCircle, Copy, Mic, MicOff, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EnhancedTranscriptWidget from './EnhancedTranscriptWidget';
import NLPDockerTester from './NLPDockerTester';

const ImplementationGuide = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({
      title: "Code copied!",
      description: "Code has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const serverCode = `// server.js - WebSocket Server for Medical ASR
const WebSocket = require('ws');
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize Google Cloud Speech client
const speechClient = new SpeechClient();

const speechConfig = {
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'en-US',
  model: 'medical_conversation',
  useEnhanced: true,
  enableSpeakerDiarization: true,
  diarizationSpeakerCount: 2,
  enableAutomaticPunctuation: true,
};

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  let recognizeStream = null;
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'start') {
      // Start streaming recognition
      recognizeStream = speechClient
        .streamingRecognize({
          config: speechConfig,
          interimResults: true,
        })
        .on('data', (response) => {
          const result = response.results[0];
          if (result) {
            const transcript = {
              text: result.alternatives[0].transcript,
              isFinal: result.isFinal,
              confidence: result.alternatives[0].confidence,
              speakers: result.alternatives[0].words?.map(word => ({
                word: word.word,
                speaker: word.speakerTag,
                startTime: word.startTime,
                endTime: word.endTime,
              })) || []
            };
            
            ws.send(JSON.stringify({
              type: 'transcript',
              data: transcript
            }));
          }
        })
        .on('error', (error) => {
          console.error('Speech recognition error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        });
    }
    
    if (data.type === 'audio' && recognizeStream) {
      // Forward audio chunks to Google Cloud Speech
      recognizeStream.write(Buffer.from(data.audio, 'base64'));
    }
    
    if (data.type === 'stop' && recognizeStream) {
      recognizeStream.end();
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    if (recognizeStream) {
      recognizeStream.end();
    }
  });
});

server.listen(8080, () => {
  console.log('WebSocket server running on port 8080');
});`;

  const clientCode = `// client.js - Browser Audio Capture
class AudioCapture {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.socket = null;
    this.isRecording = false;
  }
  
  async initialize() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      // Connect to WebSocket server
      this.socket = new WebSocket('ws://localhost:8080');
      
      this.socket.onopen = () => {
        console.log('Connected to ASR server');
      };
      
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleTranscript(message);
      };
      
      // Initialize MediaRecorder for audio capture
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.sendAudioChunk(event.data);
        }
      };
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio capture:', error);
      return false;
    }
  }
  
  startRecording() {
    if (this.mediaRecorder && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'start' }));
      
      // Record in 100ms chunks
      this.mediaRecorder.start(100);
      this.isRecording = true;
      
      console.log('Recording started');
    }
  }
  
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.socket.send(JSON.stringify({ type: 'stop' }));
      this.isRecording = false;
      
      console.log('Recording stopped');
    }
  }
  
  sendAudioChunk(audioBlob) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result.split(',')[1];
      this.socket.send(JSON.stringify({
        type: 'audio',
        audio: base64Audio
      }));
    };
    reader.readAsDataURL(audioBlob);
  }
  
  handleTranscript(message) {
    if (message.type === 'transcript') {
      const { text, isFinal, confidence, speakers } = message.data;
      
      console.log(\`\${isFinal ? 'Final' : 'Interim'}: \${text}\`);
      console.log(\`Confidence: \${confidence}\`);
      
      // Process speaker diarization
      if (speakers.length > 0) {
        const speakerMap = {};
        speakers.forEach(word => {
          if (!speakerMap[word.speaker]) {
            speakerMap[word.speaker] = [];
          }
          speakerMap[word.speaker].push(word.word);
        });
        
        Object.entries(speakerMap).forEach(([speaker, words]) => {
          console.log(\`Speaker \${speaker}: \${words.join(' ')}\`);
        });
      }
    }
  }
}

// Usage
const audioCapture = new AudioCapture();
audioCapture.initialize().then(success => {
  if (success) {
    // Ready to start recording
    document.getElementById('startBtn').onclick = () => audioCapture.startRecording();
    document.getElementById('stopBtn').onclick = () => audioCapture.stopRecording();
  }
});`;

  const tasks = [
    {
      day: 'Monday',
      title: 'Containerize & Test NLP Service',
      status: 'ready',
      tasks: [
        'Pull Docker image from Group A\'s private registry',
        'Run NLP service locally on port 8081',
        'Test /nsp/draft-note endpoint with sample transcript',
        'Verify FHIR Composition JSON response'
      ]
    },
    {
      day: 'Tuesday',
      title: 'ASR → NLP Integration in Widget',
      status: 'ready',
      tasks: [
        'Update React transcript widget with NLP calls',
        'POST full transcript to /nsp/draft-note',
        'Display FHIR Composition JSON in formatted view',
        'Add loading states and error handling'
      ]
    },
    {
      day: 'Wednesday',
      title: 'Stand-Up #1 & Error Handling',
      status: 'ready',
      tasks: [
        'Add error boundary logic in widget',
        'Implement retry/backoff for failed API calls',
        'Show friendly error banners with retry button',
        'Prepare team update for stand-up'
      ]
    },
    {
      day: 'Thursday',
      title: 'Composition-Driven Alerts',
      status: 'ready',
      tasks: [
        'Parse FHIR Composition response in frontend',
        'Detect MedicationRequest entities',
        'Show red alert banner for medications',
        'Add dismiss button functionality'
      ]
    },
    {
      day: 'Friday',
      title: 'Stand-Up #2 & Demo Prep',
      status: 'ready',
      tasks: [
        'Run full demo: Mic → ASR → NLP → Alert UI',
        'Finalize Sprint 3 integration documentation',
        'Prepare architecture handoff docs',
        'Demo end-to-end flow'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Weekly Progress */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-medical-success" />
            <span>ASR → NLP Integration Sprint</span>
          </CardTitle>
          <CardDescription>
            5-day sprint to integrate ASR with NLP service and build FHIR-compliant UI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  task.status === 'completed' ? 'bg-medical-success' :
                  task.status === 'ready' ? 'bg-medical-blue' : 'bg-slate-400'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{task.day} - {task.title}</h4>
                    <Badge variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'ready' ? 'secondary' : 'outline'
                    }>
                      {task.status}
                    </Badge>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {task.tasks.map((taskItem, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className={`w-4 h-4 ${
                          task.status === 'completed' ? 'text-medical-success' : 'text-slate-300'
                        }`} />
                        <span>{taskItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="monday" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="monday">Monday</TabsTrigger>
          <TabsTrigger value="tuesday">Tuesday</TabsTrigger>
          <TabsTrigger value="wednesday">Wednesday</TabsTrigger>
          <TabsTrigger value="thursday">Thursday</TabsTrigger>
          <TabsTrigger value="friday">Friday</TabsTrigger>
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="monday">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🔸 Monday: Containerize & Test NLP Service</CardTitle>
                <CardDescription>
                  Pull Docker image from Group A's registry and test the /compose endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NLPDockerTester />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tuesday">
          <Card>
            <CardHeader>
              <CardTitle>🔸 Tuesday: ASR → NLP Integration in Widget</CardTitle>
              <CardDescription>
                Update React transcript widget to POST transcripts to NLP service and display FHIR JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Tuesday Acceptance Criteria:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✓ Widget sends transcript to /nsp/draft-note endpoint</li>
                    <li>✓ FHIR Composition JSON appears formatted in UI panel</li>
                    <li>✓ Loading states during NLP processing</li>
                    <li>✓ Tabbed interface showing transcript and FHIR data</li>
                  </ul>
                </div>
                
                <EnhancedTranscriptWidget />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wednesday">
          <Card>
            <CardHeader>
              <CardTitle>🔸 Wednesday: Stand-Up #1 & Error Handling</CardTitle>
              <CardDescription>
                Add comprehensive error handling with retry logic and user-friendly error messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Wednesday Acceptance Criteria:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>✓ Error boundary logic in widget</li>
                    <li>✓ Exponential backoff retry mechanism</li>
                    <li>✓ Friendly error banners with retry button</li>
                    <li>✓ Network error simulation shows retry functionality</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Error Boundary Implementation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                        <code>{`// Error boundary in nlpService.ts
private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < this.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < this.maxRetries - 1) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}`}</code>
                      </pre>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">User-Friendly Error UI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                        <code>{`// Error banner with retry
{nlpError && (
  <Alert className="border-orange-200 bg-orange-50">
    <AlertTriangle className="h-4 w-4 text-orange-600" />
    <AlertDescription className="flex items-center justify-between">
      <span>NLP Processing Failed: {nlpError}</span>
      <Button onClick={retryNLPProcessing} variant="ghost">
        <RefreshCw className="h-4 w-4 mr-1" />
        Retry {retryCount > 0 && \`(\${retryCount})\`}
      </Button>
    </AlertDescription>
  </Alert>
)}`}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thursday">
          <Card>
            <CardHeader>
              <CardTitle>🔸 Thursday: Composition-Driven Alerts</CardTitle>
              <CardDescription>
                Parse FHIR responses and show alert banners for detected medical entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Thursday Acceptance Criteria:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>✓ Parse FHIR Composition response in frontend</li>
                    <li>✓ Detect MedicationRequest entities automatically</li>
                    <li>✓ Show red alert banner when medications found</li>
                    <li>✓ Dismiss button hides alert banner</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">FHIR Parsing Logic</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                        <code>{`// Check for medication alerts
useEffect(() => {
  if (nlpResponse?.medicationRequests && 
      nlpResponse.medicationRequests.length > 0) {
    setShowMedicationAlert(true);
    toast({
      title: "Medication Alert",
      description: \`\${nlpResponse.medicationRequests.length} medication(s) detected\`,
    });
  }
}, [nlpResponse]);`}</code>
                      </pre>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Alert Banner Component</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                        <code>{`{showMedicationAlert && (
  <Alert className="border-red-200 bg-red-50">
    <AlertTriangle className="h-4 w-4 text-red-600" />
    <AlertDescription className="flex items-center justify-between">
      <span className="text-red-800">
        <strong>Medication Detected:</strong> 
        {nlpResponse?.medicationRequests.length} medication request(s)
      </span>
      <Button variant="ghost" size="sm" 
              onClick={() => setShowMedicationAlert(false)}>
        <X className="h-4 w-4" />
      </Button>
    </AlertDescription>
  </Alert>
)}`}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friday">
          <Card>
            <CardHeader>
              <CardTitle>🔸 Friday: Stand-Up #2 & Demo Prep</CardTitle>
              <CardDescription>
                Final integration testing and documentation for Sprint 3 handoff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Friday Acceptance Criteria:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ End-to-end flow: Mic → ASR → NLP → Alert UI</li>
                    <li>✓ No manual steps required for demo</li>
                    <li>✓ Architecture documentation complete</li>
                    <li>✓ API handoff documentation ready</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Demo Flow Checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>WebSocket server running (port 8080)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>NLP Docker container running (port 8081)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>React widget with all tabs functional</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Error handling and retry logic working</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Medication alerts triggering correctly</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Architecture Handoff</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>Components Created:</strong></p>
                      <ul className="space-y-1 text-xs text-gray-600 ml-4">
                        <li>• EnhancedTranscriptWidget.tsx</li>
                        <li>• nlpService.ts</li>
                        <li>• NLPDockerTester.tsx</li>
                        <li>• FHIR type definitions</li>
                      </ul>
                      <p className="mt-3"><strong>Integration Points:</strong></p>
                      <ul className="space-y-1 text-xs text-gray-600 ml-4">
                        <li>• ASR WebSocket (port 8080)</li>
                        <li>• NLP REST API (port 8081)</li>
                        <li>• FHIR Composition parsing</li>
                        <li>• Alert system integration</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-6 h-6 text-medical-blue" />
                <span>Live Demo: Full ASR → NLP → Alert Flow</span>
              </CardTitle>
              <CardDescription>
                Complete end-to-end demonstration of the integrated system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedTranscriptWidget />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImplementationGuide;
