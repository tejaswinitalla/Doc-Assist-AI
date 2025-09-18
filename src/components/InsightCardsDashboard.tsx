
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Filter,
  Download,
  BarChart3,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InsightCard from './InsightCard';
import { aiInsightsService, InsightCard as InsightCardType } from '../services/aiInsightsService';

interface InsightCardsDashboardProps {
  transcript?: string;
  alerts?: any[];
  nlpResponse?: any;
}

const InsightCardsDashboard: React.FC<InsightCardsDashboardProps> = ({
  transcript = '',
  alerts = [],
  nlpResponse
}) => {
  const [insightCards, setInsightCards] = useState<InsightCardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<InsightCardType[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInsightCards();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [insightCards, categoryFilter, riskFilter]);

  const loadInsightCards = () => {
    const cards = aiInsightsService.getInsightCards();
    setInsightCards(cards);
  };

  const applyFilters = () => {
    let filtered = insightCards;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(card => card.category === categoryFilter);
    }
    
    if (riskFilter !== 'all') {
      filtered = filtered.filter(card => card.riskLevel === riskFilter);
    }
    
    setFilteredCards(filtered);
  };

  const generateInsights = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Transcript Available",
        description: "Please provide a transcript to generate insights",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newInsights = aiInsightsService.generateInsightCards(transcript, alerts, nlpResponse);
      setInsightCards(prev => [...newInsights, ...prev]);
      
      toast({
        title: "Insights Generated",
        description: `Generated ${newInsights.length} new insight cards`,
      });
      
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate insight cards",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDismissCard = (cardId: string) => {
    aiInsightsService.dismissInsightCard(cardId);
    setInsightCards(prev => prev.filter(card => card.id !== cardId));
    
    toast({
      title: "Insight Dismissed",
      description: "The insight card has been removed",
    });
  };

  const exportInsights = () => {
    const data = aiInsightsService.exportInsights();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-insights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Insights Exported",
      description: "Clinical insights data downloaded successfully",
    });
  };

  const getInsightStats = () => {
    const stats = {
      total: insightCards.filter(card => card.isActive).length,
      critical: insightCards.filter(card => card.riskLevel === 'critical' && card.isActive).length,
      high: insightCards.filter(card => card.riskLevel === 'high' && card.isActive).length,
      moderate: insightCards.filter(card => card.riskLevel === 'moderate' && card.isActive).length,
      low: insightCards.filter(card => card.riskLevel === 'low' && card.isActive).length,
    };
    return stats;
  };

  const stats = getInsightStats();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-blue-600" />
              <span>AI Clinical Insights</span>
              <Badge variant="outline">
                {stats.total} Active Insights
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={generateInsights}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generate Insights
                  </>
                )}
              </Button>
              <Button onClick={exportInsights} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs text-red-500">Critical</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
              <div className="text-xs text-orange-500">High</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.moderate}</div>
              <div className="text-xs text-yellow-500">Moderate</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
              <div className="text-xs text-blue-500">Low</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filters:</span>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
                <SelectItem value="vitals">Vitals</SelectItem>
                <SelectItem value="diagnosis">Diagnosis</SelectItem>
                <SelectItem value="contraindication">Contraindication</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Insight Cards Grid */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map(card => (
              <InsightCard
                key={card.id}
                insight={card}
                onDismiss={handleDismissCard}
                compact={true}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4">
              {filteredCards.map(card => (
                <InsightCard
                  key={card.id}
                  insight={card}
                  onDismiss={handleDismissCard}
                  compact={false}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {filteredCards.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No insight cards found</p>
            <p className="text-sm text-gray-400 mt-2">
              Generate insights from clinical transcripts to see AI-powered recommendations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InsightCardsDashboard;
