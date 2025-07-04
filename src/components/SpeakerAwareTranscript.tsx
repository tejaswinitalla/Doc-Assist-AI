
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Stethoscope, 
  Clock, 
  Eye,
  EyeOff
} from 'lucide-react';

interface SpeakerTranscript {
  id: string;
  text: string;
  speaker: 'doctor' | 'patient' | 'nurse' | 'unknown';
  timestamp: Date;
  confidence: number;
}

interface ClinicalEntity {
  text: string;
  type: 'medication' | 'condition' | 'lab_value' | 'abbreviation';
  startIndex: number;
  endIndex: number;
}

interface SpeakerAwareTranscriptProps {
  transcripts: SpeakerTranscript[];
  className?: string;
}

const SpeakerAwareTranscript: React.FC<SpeakerAwareTranscriptProps> = ({
  transcripts,
  className = ''
}) => {
  const [highlightClinicalTerms, setHighlightClinicalTerms] = useState(false);

  // Clinical entity detection using regex patterns
  const detectClinicalEntities = (text: string): ClinicalEntity[] => {
    const entities: ClinicalEntity[] = [];
    
    // Drug names pattern (common medications)
    const drugPatterns = [
      /\b(aspirin|ibuprofen|acetaminophen|lisinopril|metformin|atorvastatin|omeprazole|warfarin|prednisone|albuterol|insulin|morphine|codeine|penicillin|amoxicillin)\b/gi
    ];
    
    // Medical conditions pattern
    const conditionPatterns = [
      /\b(diabetes|hypertension|pneumonia|asthma|copd|sepsis|stroke|myocardial infarction|heart attack|chest pain|shortness of breath|fever|nausea|vomiting)\b/gi
    ];
    
    // Lab values and vital signs
    const labPatterns = [
      /\b(\d+\/\d+\s*mmhg|blood pressure|bp|heart rate|hr|temperature|temp|glucose|hemoglobin|hgb|white blood cell|wbc|creatinine|bun)\b/gi
    ];
    
    // Medical abbreviations
    const abbreviationPatterns = [
      /\b(BP|HR|RR|O2|SpO2|CBC|BMP|CMP|PT|PTT|INR|ECG|EKG|CT|MRI|X-ray|IV|PO|PRN|BID|TID|QID)\b/g
    ];

    const patterns = [
      { regex: drugPatterns, type: 'medication' as const },
      { regex: conditionPatterns, type: 'condition' as const },
      { regex: labPatterns, type: 'lab_value' as const },
      { regex: abbreviationPatterns, type: 'abbreviation' as const }
    ];

    patterns.forEach(({ regex, type }) => {
      regex.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          entities.push({
            text: match[0],
            type,
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      });
    });

    // Sort by start index to avoid overlapping highlights
    return entities.sort((a, b) => a.startIndex - b.startIndex);
  };

  const highlightText = (text: string, entities: ClinicalEntity[]) => {
    if (!highlightClinicalTerms || entities.length === 0) {
      return text;
    }

    let result = [];
    let lastIndex = 0;

    entities.forEach((entity, index) => {
      // Add text before the entity
      if (entity.startIndex > lastIndex) {
        result.push(text.slice(lastIndex, entity.startIndex));
      }

      // Add highlighted entity
      const highlightClass = {
        medication: 'bg-blue-100 text-blue-800 px-1 rounded',
        condition: 'bg-red-100 text-red-800 px-1 rounded',
        lab_value: 'bg-green-100 text-green-800 px-1 rounded',
        abbreviation: 'bg-purple-100 text-purple-800 px-1 rounded'
      }[entity.type];

      result.push(
        <span key={`entity-${index}`} className={highlightClass} title={`${entity.type}: ${entity.text}`}>
          {entity.text}
        </span>
      );

      lastIndex = entity.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'patient':
        return <User className="w-4 h-4 text-green-600" />;
      case 'nurse':
        return <User className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'doctor':
        return 'border-l-blue-500 bg-blue-50';
      case 'patient':
        return 'border-l-green-500 bg-green-50';
      case 'nurse':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5" />
            <span>Clinical Transcript</span>
          </span>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {highlightClinicalTerms ? (
                <Eye className="w-4 h-4 text-blue-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <Switch
                id="highlight-terms"
                checked={highlightClinicalTerms}
                onCheckedChange={setHighlightClinicalTerms}
              />
              <label htmlFor="highlight-terms" className="text-sm font-medium">
                Highlight Clinical Terms
              </label>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96 w-full">
          <div className="space-y-3">
            {transcripts.map((transcript) => {
              const entities = detectClinicalEntities(transcript.text);
              
              return (
                <div
                  key={transcript.id}
                  className={`p-4 border-l-4 rounded-r-lg ${getSpeakerColor(transcript.speaker)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSpeakerIcon(transcript.speaker)}
                      <Badge variant="outline" className="text-xs font-medium">
                        {transcript.speaker.charAt(0).toUpperCase() + transcript.speaker.slice(1)}
                      </Badge>
                      {entities.length > 0 && highlightClinicalTerms && (
                        <Badge variant="secondary" className="text-xs">
                          {entities.length} clinical terms
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{transcript.timestamp.toLocaleTimeString()}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(transcript.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-900 leading-relaxed">
                    {highlightText(transcript.text, entities)}
                  </p>
                </div>
              );
            })}
            
            {transcripts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No transcript data available</p>
                <p className="text-sm mt-2">Start recording to see speaker-separated transcripts</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SpeakerAwareTranscript;
