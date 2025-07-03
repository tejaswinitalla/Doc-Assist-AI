
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

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-medical-success" />
            <span>ASR → NLP Integration Overview</span>
          </CardTitle>
          <CardDescription>
            Complete integration guide for ASR with NLP service and FHIR-compliant UI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🔸 NLP Service Integration</h4>
              <p className="text-sm text-slate-600">Docker container setup and API testing</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🔸 Real-time Transcription</h4>
              <p className="text-sm text-slate-600">Live audio capture with WebSocket streaming</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🔸 FHIR Composition</h4>
              <p className="text-sm text-slate-600">Automated clinical note generation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="docker" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="docker">Docker Setup</TabsTrigger>
          <TabsTrigger value="integration">NLP Integration</TabsTrigger>
          <TabsTrigger value="testing">Live Testing</TabsTrigger>
          <TabsTrigger value="demo">Full Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="docker">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🔸 Containerize & Test NLP Service</CardTitle>
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

        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>🔸 ASR → NLP Integration</CardTitle>
              <CardDescription>
                React transcript widget integration with NLP service and FHIR JSON display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Integration Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✓ Widget sends transcript to /nsp/draft-note endpoint</li>
                    <li>✓ FHIR Composition JSON appears formatted in UI panel</li>
                    <li>✓ Loading states during NLP processing</li>
                    <li>✓ Tabbed interface showing transcript and FHIR data</li>
                    <li>✓ Error handling with retry logic</li>
                    <li>✓ Medication detection alerts</li>
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
                      <CardTitle className="text-sm">Alert System</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                        <code>{`// Medication alert detection
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>🔸 Live Audio Testing</CardTitle>
              <CardDescription>
                Test the complete ASR → NLP → FHIR pipeline with real audio input
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Testing Checklist:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ WebSocket server running (port 8080)</li>
                    <li>✓ NLP Docker container running (port 8081)</li>
                    <li>✓ Microphone permissions granted</li>
                    <li>✓ Real-time transcription working</li>
                    <li>✓ NLP processing automatic</li>
                    <li>✓ FHIR JSON generation</li>
                    <li>✓ Alert system functional</li>
                  </ul>
                </div>

                <EnhancedTranscriptWidget />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-6 h-6 text-medical-blue" />
                <span>Full System Demo</span>
              </CardTitle>
              <CardDescription>
                Complete end-to-end demonstration: Mic → ASR → NLP → FHIR → Alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Demo Flow:</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-4 h-4 text-blue-600" />
                      <span>Audio Input</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      <span>ASR Processing</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center space-x-2">
                      <Code className="w-4 h-4 text-purple-600" />
                      <span>NLP Analysis</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span>FHIR Output</span>
                    </div>
                  </div>
                </div>

                <EnhancedTranscriptWidget />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImplementationGuide;
