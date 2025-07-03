
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Terminal, FileText, Play, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const packageJsonCode = `{
  "name": "medical-asr-prototype",
  "version": "1.0.0",
  "description": "Voice capture and live transcript widget",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@google-cloud/speech": "^6.0.0",
    "express": "^4.18.2",
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}`;

  const tasks = [
    {
      day: 'Monday',
      title: 'ASR Provider Evaluation',
      status: 'completed',
      tasks: [
        'Research Google Cloud, AWS, and Speechmatics',
        'Create comparison matrix',
        'Document recommendation'
      ]
    },
    {
      day: 'Tuesday',
      title: 'Streaming ASR Proof-of-Concept',
      status: 'ready',
      tasks: [
        'Initialize Node.js WebSocket server',
        'Implement audio capture with 100ms chunks',
        'Connect to selected ASR API',
        'Log interim and final transcripts'
      ]
    },
    {
      day: 'Wednesday',
      title: 'Diarization & Stand-Up #1',
      status: 'pending',
      tasks: [
        'Enable speaker diarization',
        'Parse speaker labels from transcripts',
        'Prepare team update'
      ]
    },
    {
      day: 'Thursday',
      title: 'React Transcript Widget',
      status: 'pending',
      tasks: [
        'Scaffold React frontend',
        'Connect WebSocket stream',
        'Render live transcripts'
      ]
    },
    {
      day: 'Friday',
      title: 'Stand-Up #2 & Demo Prep',
      status: 'pending',
      tasks: [
        'Add Start/Stop UI buttons',
        'Document POC architecture',
        'Prepare demo flow'
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
            <span>Weekly Sprint Progress</span>
          </CardTitle>
          <CardDescription>
            Track your medical ASR prototype development
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

      <Tabs defaultValue="server" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="server">WebSocket Server</TabsTrigger>
          <TabsTrigger value="client">Audio Capture</TabsTrigger>
          <TabsTrigger value="setup">Project Setup</TabsTrigger>
          <TabsTrigger value="testing">Testing Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5" />
                  <span>WebSocket Server Implementation</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(serverCode, 'server')}
                >
                  {copiedCode === 'server' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Node.js server with Google Cloud Speech integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{serverCode}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Browser Audio Capture</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(clientCode, 'client')}
                >
                  {copiedCode === 'client' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Audio capture with 100ms chunking and WebSocket streaming
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{clientCode}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Project Setup</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(packageJsonCode, 'package')}
                >
                  {copiedCode === 'package' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Package.json and environment setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Initialize Node.js Project</h4>
                <pre className="bg-slate-100 p-3 rounded text-sm">
                  <code>mkdir medical-asr-prototype && cd medical-asr-prototype</code>
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2. Package.json</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{packageJsonCode}</code>
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">3. Environment Setup</h4>
                <div className="space-y-2 text-sm">
                  <p>• Install Google Cloud SDK</p>
                  <p>• Set up service account credentials</p>
                  <p>• Enable Cloud Speech-to-Text API</p>
                  <p>• Run: <code className="bg-slate-100 px-2 py-1 rounded">npm install</code></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Testing Your Implementation</span>
              </CardTitle>
              <CardDescription>
                Step-by-step testing guide for your POC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-blue text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">Start the WebSocket Server</h4>
                    <p className="text-sm text-slate-600">Run <code>npm start</code> and verify server starts on port 8080</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-teal text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">Test Audio Capture</h4>
                    <p className="text-sm text-slate-600">Open browser, allow microphone access, verify audio chunks are captured</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-success text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Verify ASR Connection</h4>
                    <p className="text-sm text-slate-600">Check console logs for interim and final transcripts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-warning text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold">Test Medical Vocabulary</h4>
                    <p className="text-sm text-slate-600">Speak medical terms like "bradycardia", "hypertension", "auscultation"</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-medical-blue/10 border border-medical-blue/20 rounded-lg">
                <h4 className="font-semibold text-medical-blue mb-2">Expected Output:</h4>
                <pre className="text-sm text-slate-700">
{`Interim: The patient presents with
Final: The patient presents with bradycardia
Speaker 1: The patient presents with bradycardia
Speaker 2: What's the heart rate?`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImplementationGuide;
