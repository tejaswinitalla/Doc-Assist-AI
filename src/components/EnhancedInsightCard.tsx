
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
  FileText,
  CheckCircle,
  TrendingUp,
  Eye,
  Target
} from 'lucide-react';
import { InsightCard as InsightCardType } from '../services/aiInsightsService';

interface EnhancedInsightCardProps {
  insight: InsightCardType;
  onDismiss: (cardId: string) => void;
  onViewDetails: (cardId: string) => void;
  onTakeAction: (cardId: string, action: string) => void;
  compact?: boolean;
  showMetrics?: boolean;
  className?: string;
}

const EnhancedInsightCard: React.FC<EnhancedInsightCardProps> = ({
  insight,
  onDismiss,
  onViewDetails,
  onTakeAction,
  compact = false,
  showMetrics = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isHovered, setIsHovered] = useState(false);

  const getRiskConfig = () => {
    switch (insight.riskLevel) {
      case 'critical':
        return {
          badgeColor: 'bg-red-600 text-white',
          cardBorder: 'border-red-300 hover:border-red-400',
          cardBg: 'bg-gradient-to-br from-red-50 to-red-100',
          iconColor: 'text-red-600',
          shadowColor: 'hover:shadow-red-200',
          priority: 'HIGH PRIORITY'
        };
      case 'high':
        return {
          badgeColor: 'bg-orange-600 text-white',
          cardBorder: 'border-orange-300 hover:border-orange-400',
          cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
          iconColor: 'text-orange-600',
          shadowColor: 'hover:shadow-orange-200',
          priority: 'MONITOR'
        };
      case 'moderate':
        return {
          badgeColor: 'bg-yellow-600 text-white',
          cardBorder: 'border-yellow-300 hover:border-yellow-400',
          cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
          iconColor: 'text-yellow-600',
          shadowColor: 'hover:shadow-yellow-200',
          priority: 'REVIEW'
        };
      case 'low':
        return {
          badgeColor: 'bg-blue-600 text-white',
          cardBorder: 'border-blue-300 hover:border-blue-400',
          cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          iconColor: 'text-blue-600',
          shadowColor: 'hover:shadow-blue-200',
          priority: 'INFO'
        };
      default:
        return {
          badgeColor: 'bg-gray-600 text-white',
          cardBorder: 'border-gray-300 hover:border-gray-400',
          cardBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          iconColor: 'text-gray-600',
          shadowColor: 'hover:shadow-gray-200',
          priority: 'GENERAL'
        };
    }
  };

  const getInsightIcon = () => {
    if (insight.riskLevel === 'critical' || insight.riskLevel === 'high') {
      return AlertTriangle;
    }
    
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
        return CheckCircle;
    }
  };

  const config = getRiskConfig();
  const InsightIcon = getInsightIcon();

  const handleActionClick = (action: string) => {
    onTakeAction(insight.id, action);
  };

  return (
    <Card 
      className={`
        ${className} 
        ${config.cardBorder} 
        ${config.cardBg} 
        ${config.shadowColor}
        shadow-lg transition-all duration-300 
        hover:shadow-xl hover:scale-[1.02]
        cursor-pointer
        relative overflow-hidden
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority Stripe */}
      <div className={`absolute top-0 left-0 w-full h-1 ${
        insight.riskLevel === 'critical' ? 'bg-red-500' :
        insight.riskLevel === 'high' ? 'bg-orange-500' :
        insight.riskLevel === 'moderate' ? 'bg-yellow-500' : 'bg-blue-500'
      }`} />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-white ${config.iconColor} shadow-sm`}>
              <InsightIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <Badge className={`${config.badgeColor} text-xs font-bold px-2 py-1`}>
                  {config.priority}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {insight.category}
                </Badge>
              </div>
              {showMetrics && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Target className="w-3 h-3" />
                  <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {insight.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(insight.id);
              }}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 text-lg leading-tight">
            {insight.title}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {insight.summary}
          </p>
        </div>

        {/* Risk Indicator Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              insight.riskLevel === 'critical' ? 'bg-red-500' :
              insight.riskLevel === 'high' ? 'bg-orange-500' :
              insight.riskLevel === 'moderate' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${insight.confidence * 100}%` }}
          />
        </div>

        {/* Triggers */}
        <div className="flex flex-wrap gap-1">
          {insight.triggers.slice(0, 3).map((trigger, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-white/70">
              {trigger}
            </Badge>
          ))}
          {insight.triggers.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-white/70">
              +{insight.triggers.length - 3} more
            </Badge>
          )}
        </div>

        {compact && (
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="w-full justify-center"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show Details
              </>
            )}
          </Button>
        )}

        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Source Information */}
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Evidence Source:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {insight.source.type}
                  </Badge>
                  {insight.source.url && (
                    <a 
                      href={insight.source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-sm text-blue-700 font-medium">{insight.source.name}</p>
            </div>

            {/* Recommendations */}
            {insight.recommendations.length > 0 && (
              <div className="bg-white/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Recommended Actions:
                </h4>
                <ul className="text-sm space-y-2">
                  {insight.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-600 flex-1">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(insight.id);
                }}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick('review');
                }}
                className={`flex-1 ${config.badgeColor}`}
                size="sm"
              >
                Take Action
              </Button>
            </div>
          </div>
        )}

        {/* Hover state enhancement */}
        {isHovered && (
          <div className="absolute inset-0 bg-white/10 pointer-events-none rounded-lg transition-opacity duration-200" />
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedInsightCard;
