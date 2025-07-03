
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Pause, Square, Mic, FileAudio, Clock, Target, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const AudioTesting = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const sampleClips = [
    {
      name: 'Patient Consultation',
      duration: '2:30',
      description: 'General examination with medical terminology',
      difficulty: 'Medium',
      expectedWER: '12%'
    },
    {
      name: 'Surgical Notes',
      duration: '1:45',
      description: 'Post-operative procedure documentation',
      difficulty: 'High',
      expectedWER: '8%'
    },
    {
      name: 'Medication Review',
      duration: '3:15',
      description: 'Pharmacist consultation with drug names',
      difficulty: 'Medium',
      expectedWER: '10%'
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        toast.success('Audio file uploaded successfully');
      } else {
        toast.error('Please select a valid audio file');
      }
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
      toast.error('Please select an audio file first');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionProgress(0);

    // Simulate transcription progress
    const progressInterval = setInterval(() => {
      setTranscriptionProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Simulate API response after 3 seconds
    setTimeout(() => {
      setIsTranscribing(false);
      setTranscriptionResult({
        text: "The patient presents with chest pain radiating to the left arm. Vital signs are stable with blood pressure 120 over 80, heart rate 72 beats per minute. Auscultation reveals normal heart sounds with no murmurs. Recommend ECG and cardiac enzymes.",
        confidence: 0.92,
        duration: 30,
        wordCount: 42,
        wer: 9.2,
        latency: 1.8,
        medicalTerms: ['chest pain', 'blood pressure', 'heart rate', 'auscultation', 'murmurs', 'ECG', 'cardiac enzymes']
      });
      toast.success('Transcription completed successfully');
    }, 3000);
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Audio Transcription Testing</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Upload clinical audio samples and test transcription accuracy with medical ASR services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2 text-medical-blue" />
              Audio Upload
            </CardTitle>
            <CardDescription>
              Upload your clinical audio file for transcription testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFile ? 'border-medical-success bg-medical-success/5' : 'border-slate-300 hover:border-medical-blue'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-medical-success mx-auto" />
                  <p className="font-semibold text-medical-success">{selectedFile.name}</p>
                  <p className="text-sm text-slate-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileAudio className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-slate-600">Click to upload audio file</p>
                  <p className="text-xs text-slate-500">
                    Supports MP3, WAV, M4A formats
                  </p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={togglePlayback}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </Button>
                  <audio
                    ref={audioRef}
                    src={selectedFile ? URL.createObjectURL(selectedFile) : ''}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>

                <Button
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="w-full"
                >
                  {isTranscribing ? (
                    <>
                      <Mic className="w-4 h-4 mr-2 animate-pulse" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Transcription
                    </>
                  )}
                </Button>

                {isTranscribing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing audio...</span>
                      <span>{transcriptionProgress}%</span>
                    </div>
                    <Progress value={transcriptionProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample Clips */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileAudio className="w-5 h-5 mr-2 text-medical-teal" />
              Sample Clinical Clips
            </CardTitle>
            <CardDescription>
              Pre-loaded audio samples for quick testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sampleClips.map((clip, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">{clip.name}</h4>
                    <p className="text-xs text-slate-600">{clip.description}</p>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{clip.duration}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {clip.difficulty}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>{clip.expectedWER}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Use Sample
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Transcription Results */}
      {transcriptionResult && (
        <Card className="medical-card animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-medical-success" />
              Transcription Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-medical-blue-light rounded-lg">
                <div className="text-2xl font-bold text-medical-blue">
                  {transcriptionResult.wer}%
                </div>
                <div className="text-xs text-slate-600">Word Error Rate</div>
              </div>
              <div className="text-center p-3 bg-medical-teal-light rounded-lg">
                <div className="text-2xl font-bold text-medical-teal">
                  {transcriptionResult.latency}s
                </div>
                <div className="text-xs text-slate-600">Response Time</div>
              </div>
              <div className="text-center p-3 bg-slate-100 rounded-lg">
                <div className="text-2xl font-bold text-slate-700">
                  {Math.round(transcriptionResult.confidence * 100)}%
                </div>
                <div className="text-xs text-slate-600">Confidence</div>
              </div>
              <div className="text-center p-3 bg-slate-100 rounded-lg">
                <div className="text-2xl font-bold text-slate-700">
                  {transcriptionResult.wordCount}
                </div>
                <div className="text-xs text-slate-600">Words</div>
              </div>
            </div>

            {/* Transcribed Text */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-700">Transcribed Text</h4>
              <div className="p-4 bg-slate-50 rounded-lg border">
                <p className="text-slate-800 leading-relaxed">{transcriptionResult.text}</p>
              </div>
            </div>

            {/* Medical Terms Detected */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-700">Medical Terms Detected</h4>
              <div className="flex flex-wrap gap-2">
                {transcriptionResult.medicalTerms.map((term: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-medical-success/10 text-medical-success">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Performance Assessment */}
            <div className="p-4 bg-gradient-to-r from-medical-success/10 to-medical-teal/10 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-medical-success" />
                <h4 className="font-semibold text-medical-success">Performance Assessment</h4>
              </div>
              <p className="text-sm text-slate-700">
                Excellent results! WER of {transcriptionResult.wer}% is well below the 15% target, 
                and latency of {transcriptionResult.latency}s meets the &lt;2s requirement. 
                Medical terminology was accurately recognized.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AudioTesting;
