import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Volume2, VolumeX, AlertTriangle, 
  CheckCircle, Clock, Zap, Waves, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceState {
  status: 'idle' | 'listening' | 'processing' | 'complete' | 'error';
  isRecording: boolean;
  volume: number;
  transcript?: string;
  confidence?: number;
  alerts?: Array<{
    id: string;
    keyword: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
}

interface VoiceUIAnimationsProps {
  voiceState: VoiceState;
  onToggleRecording: () => void;
  onDismissAlert: (alertId: string) => void;
}

const VoiceUIAnimations: React.FC<VoiceUIAnimationsProps> = ({
  voiceState,
  onToggleRecording,
  onDismissAlert
}) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  useEffect(() => {
    if (voiceState.isRecording) {
      // Simulate dynamic waveform based on volume
      const interval = setInterval(() => {
        const newWave = Array.from({length: 20}, () => Math.random() * voiceState.volume * 100);
        setWaveform(newWave);
        setPulseIntensity(voiceState.volume);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setWaveform([]);
      setPulseIntensity(0);
    }
  }, [voiceState.isRecording, voiceState.volume]);

  const getMicrophoneIcon = () => {
    switch (voiceState.status) {
      case 'listening':
        return <Mic className="w-8 h-8 text-white" />;
      case 'processing':
        return <Zap className="w-8 h-8 text-white animate-pulse" />;
      case 'complete':
        return <CheckCircle className="w-8 h-8 text-white" />;
      case 'error':
        return <MicOff className="w-8 h-8 text-white" />;
      default:
        return <Mic className="w-8 h-8 text-white" />;
    }
  };

  const getMicrophoneColor = () => {
    switch (voiceState.status) {
      case 'listening':
        return 'bg-medical-success hover:bg-medical-success/80';
      case 'processing':
        return 'bg-medical-warning hover:bg-medical-warning/80';
      case 'complete':
        return 'bg-primary hover:bg-primary/80';
      case 'error':
        return 'bg-medical-error hover:bg-medical-error/80';
      default:
        return 'bg-muted-foreground hover:bg-muted-foreground/80';
    }
  };

  const getStatusText = () => {
    switch (voiceState.status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing speech...';
      case 'complete':
        return 'Transcription complete';
      case 'error':
        return 'Voice input error';
      default:
        return 'Click to start recording';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-medical-error border-medical-error text-white animate-pulse';
      case 'high':
        return 'bg-medical-warning border-medical-warning text-white';
      case 'medium':
        return 'bg-medical-teal border-medical-teal text-white';
      case 'low':
        return 'bg-medical-success border-medical-success text-white';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Input Interface */}
      <Card className="medical-card border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Microphone Button with Animated Ring */}
            <div className="relative">
              {/* Animated rings for recording state */}
              {voiceState.isRecording && (
                <>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-medical-success/30 animate-ping"
                    style={{
                      transform: `scale(${1 + pulseIntensity})`,
                      animationDuration: '1s'
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-medical-success/50 animate-pulse"
                    style={{
                      transform: `scale(${1.2 + pulseIntensity * 0.5})`,
                      animationDuration: '2s'
                    }}
                  />
                </>
              )}
              
              <Button
                onClick={onToggleRecording}
                className={cn(
                  "w-20 h-20 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105",
                  getMicrophoneColor(),
                  voiceState.isRecording && "shadow-xl shadow-medical-success/25"
                )}
                style={{
                  transform: voiceState.isRecording 
                    ? `scale(${1.05 + pulseIntensity * 0.1})` 
                    : 'scale(1)'
                }}
              >
                {getMicrophoneIcon()}
              </Button>
            </div>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                {getStatusText()}
              </p>
              {voiceState.confidence && (
                <Badge variant="outline" className="text-xs">
                  Confidence: {Math.round(voiceState.confidence * 100)}%
                </Badge>
              )}
            </div>

            {/* Waveform Visualization */}
            {voiceState.isRecording && (
              <div className="flex items-end space-x-1 h-16">
                {waveform.map((height, index) => (
                  <div
                    key={index}
                    className="bg-medical-success rounded-full transition-all duration-100"
                    style={{
                      width: '4px',
                      height: `${Math.max(4, height)}px`,
                      opacity: 0.3 + (height / 100) * 0.7
                    }}
                  />
                ))}
              </div>
            )}

            {/* Live Transcript */}
            {voiceState.transcript && (
              <div className="w-full max-w-2xl">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center mb-2">
                    <Activity className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-medium text-foreground">Live Transcript</span>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {voiceState.transcript}
                    {voiceState.status === 'listening' && (
                      <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Alerts Panel */}
      {voiceState.alerts && voiceState.alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-medical-warning" />
            Clinical Alerts
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {voiceState.alerts.map((alert, index) => (
              <Card 
                key={alert.id}
                className={cn(
                  "border-l-4 animate-slide-up",
                  getAlertSeverityColor(alert.severity)
                )}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs font-semibold uppercase"
                        >
                          {alert.severity} Priority
                        </Badge>
                        <Badge 
                          variant="secondary"
                          className="text-xs font-mono"
                        >
                          {alert.keyword}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        Keyword "{alert.keyword}" detected
                      </p>
                      <p className="text-xs opacity-90">
                        {alert.message}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismissAlert(alert.id)}
                      className="ml-4 opacity-70 hover:opacity-100"
                    >
                      ×
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Voice Commands Help */}
      <Card className="medical-card">
        <CardContent className="p-6">
          <h4 className="font-semibold text-foreground mb-4 flex items-center">
            <Volume2 className="w-4 h-4 mr-2" />
            Voice Commands
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-foreground mb-2">Recording Control:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• "Start recording" - Begin voice input</li>
                <li>• "Stop recording" - End voice input</li>
                <li>• "Pause listening" - Temporarily disable</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Clinical Actions:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• "Repeat that" - Replay last transcript</li>
                <li>• "Clear transcript" - Reset session</li>
                <li>• "Save transcript" - Store current session</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceUIAnimations;