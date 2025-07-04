
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, ExternalLink, Clock, User, CheckCircle, X, MessageSquare } from 'lucide-react';
import { ClinicalAlert } from '../services/clinicalAlertService';

interface ClinicalAlertCardProps {
  alert: ClinicalAlert;
  onAcknowledge: (alertId: string) => void;
  onOverride: (alertId: string, comment: string) => void;
  className?: string;
}

const ClinicalAlertCard: React.FC<ClinicalAlertCardProps> = ({
  alert,
  onAcknowledge,
  onOverride,
  className = ''
}) => {
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideComment, setOverrideComment] = useState('');

  const getSeverityConfig = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          badgeColor: 'bg-red-500 text-white',
          cardBorder: 'border-red-200',
          cardBg: 'bg-red-50',
          iconColor: 'text-red-600'
        };
      case 'caution':
        return {
          badgeColor: 'bg-yellow-500 text-white',
          cardBorder: 'border-yellow-200',
          cardBg: 'bg-yellow-50',
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          badgeColor: 'bg-gray-500 text-white',
          cardBorder: 'border-gray-200',
          cardBg: 'bg-gray-50',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getSeverityConfig();

  const handleOverrideSubmit = () => {
    if (overrideComment.trim()) {
      onOverride(alert.id, overrideComment.trim());
      setShowOverrideForm(false);
      setOverrideComment('');
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (alert.isAcknowledged || alert.isOverridden) {
    return (
      <Card className={`${className} opacity-60 border-gray-200`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {alert.isAcknowledged ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-orange-600" />
              )}
              <span className="text-sm text-gray-600">
                {alert.isAcknowledged ? 'Acknowledged' : 'Overridden'} - {alert.message}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatTimestamp(alert.userResponse?.timestamp || alert.timestamp)}
            </Badge>
          </div>
          {alert.userResponse?.comment && (
            <div className="mt-2 text-xs text-gray-500 italic">
              Comment: "{alert.userResponse.comment}"
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${config.cardBorder} ${config.cardBg} shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-5 h-5 ${config.iconColor}`} />
            <Badge className={config.badgeColor}>
              {alert.severity.toUpperCase()}
            </Badge>
            <span className="text-sm font-medium capitalize">
              {alert.type.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatTimestamp(alert.timestamp)}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-0 p-3">
          <AlertDescription className="text-sm font-medium">
            {alert.message}
          </AlertDescription>
        </Alert>

        <div className="space-y-2 text-xs">
          <div className="flex items-start space-x-2">
            <span className="font-medium text-gray-600">Detected:</span>
            <span className="italic">"{alert.detectedPhrase}"</span>
          </div>
          
          <div className="flex items-start space-x-2">
            <span className="font-medium text-gray-600">Context:</span>
            <span className="text-gray-700">{alert.context}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-600">Source:</span>
              <span className="text-blue-700">{alert.source}</span>
              {alert.sourceUrl && (
                <a 
                  href={alert.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {!showOverrideForm ? (
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={() => onAcknowledge(alert.id)}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Acknowledge
            </Button>
            <Button
              onClick={() => setShowOverrideForm(true)}
              size="sm"
              variant="outline"
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Override
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Override Reason (Required)
              </label>
              <Textarea
                value={overrideComment}
                onChange={(e) => setOverrideComment(e.target.value)}
                placeholder="Please provide a reason for overriding this alert..."
                className="text-xs min-h-[60px]"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleOverrideSubmit}
                disabled={!overrideComment.trim()}
                size="sm"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Submit Override
              </Button>
              <Button
                onClick={() => {
                  setShowOverrideForm(false);
                  setOverrideComment('');
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicalAlertCard;
