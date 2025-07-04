
import React from 'react';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MicrophoneState } from '../services/voiceInteractionService';

interface MicrophoneIndicatorProps {
  state: MicrophoneState;
  className?: string;
}

const MicrophoneIndicator: React.FC<MicrophoneIndicatorProps> = ({ state, className = '' }) => {
  const getStatusConfig = () => {
    switch (state.status) {
      case 'listening':
        return {
          icon: Mic,
          color: 'bg-green-500',
          textColor: 'text-green-700',
          label: 'Listening',
          animate: true
        };
      case 'processing':
        return {
          icon: Loader2,
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          label: 'Processing',
          animate: true
        };
      case 'muted':
        return {
          icon: MicOff,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          label: 'Muted',
          animate: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-red-500',
          textColor: 'text-red-700',
          label: 'Error',
          animate: false
        };
      default:
        return {
          icon: MicOff,
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          label: 'Idle',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div 
          className={`w-3 h-3 rounded-full ${config.color} ${config.animate ? 'animate-pulse' : ''}`}
        />
        {state.status === 'listening' && (
          <>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-300 animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>
      
      <Badge variant="outline" className={`${config.textColor} border-current`}>
        <Icon className={`w-3 h-3 mr-1 ${config.animate && config.icon === Loader2 ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>

      {state.status === 'listening' && (
        <div className="flex items-center space-x-1">
          <div className="text-xs text-gray-500">Volume:</div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-1 h-4 rounded-sm ${
                  state.volume >= level * 20 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                } transition-colors duration-200`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MicrophoneIndicator;
