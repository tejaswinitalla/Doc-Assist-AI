
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  X, 
  ChevronDown, 
  ChevronUp,
  Heart,
  Pill,
  Activity,
  FileText
} from 'lucide-react';
import { InsightCard as InsightCardType } from '../services/aiInsightsService';

interface InsightCardProps {
  insight: InsightCardType;
  onDismiss: (cardId: string) => void;
  compact?: boolean;
  className?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onDismiss,
  compact = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const getRiskConfig = () => {
    switch (insight.riskLevel) {
      case 'critical':
        return {
          badgeColor: 'bg-red-600 text-white',
          cardBorder: 'border-red-200',
          cardBg: 'bg-red-50',
          iconColor: 'text-red-600'
        };
      case 'high':
        return {
          badgeColor: 'bg-orange-600 text-white',
          cardBorder: 'border-orange-200',
          cardBg: 'bg-orange-50',
          iconColor: 'text-orange-600'
        };
      case 'moderate':
        return {
          badgeColor: 'bg-yellow-600 text-white',
          cardBorder: 'border-yellow-200',
          cardBg: 'bg-yellow-50',
          iconColor: 'text-yellow-600'
        };
      case 'low':
        return {
          badgeColor: 'bg-blue-600 text-white',
          cardBorder: 'border-blue-200',
          cardBg: 'bg-blue-50',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          badgeColor: 'bg-gray-600 text-white',
          cardBorder: 'border-gray-200',
          cardBg: 'bg-gray-50',
          iconColor: 'text-gray-600'
        };
    }
  };

  const getCategoryIcon = () => {
    switch (insight.category) {
      case 'medication':
        return Pill;
      case 'vitals':
        return Activity;
      case 'diagnosis':
        return FileText;
      case 'contraindication':
        return AlertTriangle;
      default:
        return Heart;
    }
  };

  const config = getRiskConfig();
  const CategoryIcon = getCategoryIcon();

  return (
    <Card className={`${className} ${config.cardBorder} ${config.cardBg} shadow-lg transition-all duration-200 hover:shadow-xl`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CategoryIcon className={`w-5 h-5 ${config.iconColor}`} />
            <Badge className={config.badgeColor}>
              {insight.riskLevel.toUpperCase()}
            </Badge>
            <span className="text-sm font-medium capitalize">
              {insight.category}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {insight.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <Button
              onClick={() => onDismiss(insight.id)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
          <p className="text-sm text-gray-700">{insight.summary}</p>
        </div>

        {compact && (
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show More
              </>
            )}
          </Button>
        )}

        {isExpanded && (
          <div className="space-y-4">
            <div className="text-xs space-y-2">
              <div>
                <span className="font-medium text-gray-600">Confidence:</span>
                <Badge variant="outline" className="ml-2">
                  {Math.round(insight.confidence * 100)}%
                </Badge>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Triggers:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {insight.triggers.map((trigger, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Source:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {insight.source.type}
                  </Badge>
                  <span className="text-sm text-blue-700">{insight.source.name}</span>
                  {insight.source.url && (
                    <a 
                      href={insight.source.url} 
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

            {insight.recommendations.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h4>
                <ul className="text-xs space-y-1">
                  {insight.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-600">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightCard;
