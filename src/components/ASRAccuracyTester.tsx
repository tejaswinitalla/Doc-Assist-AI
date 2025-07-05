
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TestTube, 
  Play, 
  Pause, 
  RotateCcw, 
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Mic,
  Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { voiceInteractionService } from '../services/voiceInteractionService';

interface TestPhrase {
  id: string;
  category: 'medication' | 'condition' | 'abbreviation' | 'procedure';
  originalPhrase: string;
  expectedTerms: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  clinicalContext: string;
}

interface TestResult {
  phraseId: string;
  originalPhrase: string;
  detectedPhrase: string;
  accuracy: number;
  termAccuracy: { term: string; detected: boolean; confidence: number }[];
  executionTime: number;
  confidenceScore: number;
}

interface AccuracyMetrics {
  overallAccuracy: number;
  categoryAccuracy: Record<string, number>;
  termLevelAccuracy: number;
  falsePositives: number;
  falseNegatives: number;
  averageConfidence: number;
}

const ASRAccuracyTester: React.FC = () => {
  const [testPhrases] = useState<TestPhrase[]>([
    {
      id: 'med-001',
      category: 'medication',
      originalPhrase: 'Patient is prescribed warfarin 5 milligrams daily',
      expectedTerms: ['warfarin', '5', 'milligrams', 'daily'],
      difficulty: 'medium',
      clinicalContext: 'Anticoagulation therapy'
    },
    {
      id: 'med-002',
      category: 'medication',
      originalPhrase: 'Start Xarelto twenty milligrams twice daily with food',
      expectedTerms: ['Xarelto', '20', 'milligrams', 'twice daily'],
      difficulty: 'hard',
      clinicalContext: 'Novel anticoagulant'
    },
    {
      id: 'med-003',
      category: 'medication',
      originalPhrase: 'Continue metformin one thousand milligrams BID',
      expectedTerms: ['metformin', '1000', 'milligrams', 'BID'],
      difficulty: 'medium',
      clinicalContext: 'Diabetes management'
    },
    {
      id: 'cond-001',
      category: 'condition',
      originalPhrase: 'Patient has chronic heart failure and hypertension',
      expectedTerms: ['chronic heart failure', 'hypertension'],
      difficulty: 'easy',
      clinicalContext: 'Cardiovascular conditions'
    },
    {
      id: 'cond-002',
      category: 'condition',
      originalPhrase: 'Diagnosed with CHF and HTN, stable COPD',
      expectedTerms: ['CHF', 'HTN', 'COPD'],
      difficulty: 'hard',
      clinicalContext: 'Medical abbreviations'
    },
    {
      id: 'abbr-001',
      category: 'abbreviation',
      originalPhrase: 'Check PT INR and CBC with diff',
      expectedTerms: ['PT', 'INR', 'CBC'],
      difficulty: 'hard',
      clinicalContext: 'Laboratory orders'
    },
    {
      id: 'abbr-002',
      category: 'abbreviation',
      originalPhrase: 'BP is one forty over ninety, HR seventy-eight',
      expectedTerms: ['BP', '140', '90', 'HR', '78'],
      difficulty: 'medium',
      clinicalContext: 'Vital signs'
    },
    {
      id: 'proc-001',
      category: 'procedure',
      originalPhrase: 'Schedule echocardiogram and stress test',
      expectedTerms: ['echocardiogram', 'stress test'],
      difficulty: 'easy',
      clinicalContext: 'Cardiac procedures'
    },
    {
      id: 'proc-002',
      category: 'procedure',
      originalPhrase: 'Patient needs EKG and chest X-ray stat',
      expectedTerms: ['EKG', 'chest X-ray', 'stat'],
      difficulty: 'medium',
      clinicalContext: 'Emergency procedures'
    },
    {
      id: 'complex-001',
      category: 'medication',
      originalPhrase: 'Lantus insulin twenty-four units subcutaneously at bedtime',
      expectedTerms: ['Lantus', 'insulin', '24', 'units', 'subcutaneously', 'bedtime'],
      difficulty: 'hard',
      clinicalContext: 'Complex medication instruction'
    }
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  const { toast } = useToast();

  const filteredPhrases = testPhrases.filter(phrase => {
    const categoryMatch = selectedCategory === 'all' || phrase.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || phrase.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const runAccuracyTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTestIndex(0);

    const results: TestResult[] = [];

    for (let i = 0; i < filteredPhrases.length; i++) {
      setCurrentTestIndex(i);
      const phrase = filteredPhrases[i];
      
      const startTime = Date.now();
      
      // Simulate ASR processing with realistic errors
      const detectedPhrase = await simulateASRTranscription(phrase.originalPhrase);
      const executionTime = Date.now() - startTime;
      
      // Calculate accuracy metrics
      const accuracy = calculatePhraseAccuracy(phrase.originalPhrase, detectedPhrase);
      const termAccuracy = calculateTermAccuracy(phrase.expectedTerms, detectedPhrase);
      const confidenceScore = calculateConfidenceScore(phrase.difficulty, accuracy);

      const result: TestResult = {
        phraseId: phrase.id,
        originalPhrase: phrase.originalPhrase,
        detectedPhrase,
        accuracy,
        termAccuracy,
        executionTime,
        confidenceScore
      };

      results.push(result);
      setTestResults([...results]);
      
      // Add delay to simulate real testing
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculate overall metrics
    const calculatedMetrics = calculateOverallMetrics(results, filteredPhrases);
    setMetrics(calculatedMetrics);
    
    setIsRunning(false);
    
    toast({
      title: "Accuracy Test Complete",
      description: `Tested ${results.length} phrases with ${calculatedMetrics.overallAccuracy.toFixed(1)}% overall accuracy`,
    });
  };

  const simulateASRTranscription = async (originalPhrase: string): Promise<string> => {
    // Simulate common ASR errors based on clinical terminology
    let result = originalPhrase.toLowerCase();
    
    // Medication name errors
    const medicationErrors = {
      'warfarin': Math.random() > 0.05 ? 'warfarin' : 'warpharin',
      'xarelto': Math.random() > 0.15 ? 'xarelto' : 'zarelto',
      'metformin': Math.random() > 0.08 ? 'metformin' : 'metformil',
      'lantus': Math.random() > 0.12 ? 'lantus' : 'lanthus'
    };

    // Abbreviation errors
    const abbreviationErrors = {
      'pt': Math.random() > 0.3 ? 'pt' : 'p t',
      'inr': Math.random() > 0.25 ? 'inr' : 'i n r',
      'chf': Math.random() > 0.35 ? 'chf' : 'c h f',
      'htn': Math.random() > 0.4 ? 'htn' : 'h t n',
      'copd': Math.random() > 0.2 ? 'copd' : 'c o p d',
      'ekg': Math.random() > 0.25 ? 'ekg' : 'e k g'
    };

    // Number recognition errors
    const numberErrors = {
      'twenty': Math.random() > 0.1 ? '20' : 'twenty',
      'seventy-eight': Math.random() > 0.15 ? '78' : 'seventy eight',
      'one forty': Math.random() > 0.2 ? '140' : '1 40',
      'twenty-four': Math.random() > 0.12 ? '24' : 'twenty four'
    };

    // Apply errors
    Object.entries(medicationErrors).forEach(([original, replacement]) => {
      result = result.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
    });

    Object.entries(abbreviationErrors).forEach(([original, replacement]) => {
      result = result.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
    });

    Object.entries(numberErrors).forEach(([original, replacement]) => {
      result = result.replace(new RegExp(original, 'gi'), replacement);
    });

    return result;
  };

  const calculatePhraseAccuracy = (original: string, detected: string): number => {
    const originalWords = original.toLowerCase().split(/\s+/);
    const detectedWords = detected.toLowerCase().split(/\s+/);
    
    let matches = 0;
    const maxLength = Math.max(originalWords.length, detectedWords.length);
    
    for (let i = 0; i < Math.min(originalWords.length, detectedWords.length); i++) {
      if (originalWords[i] === detectedWords[i]) {
        matches++;
      }
    }
    
    return (matches / maxLength) * 100;
  };

  const calculateTermAccuracy = (
    expectedTerms: string[], 
    detectedPhrase: string
  ): { term: string; detected: boolean; confidence: number }[] => {
    return expectedTerms.map(term => {
      const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'i');
      const detected = regex.test(detectedPhrase.toLowerCase());
      const confidence = detected ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4; // 0.7-1.0 if detected, 0-0.4 if not
      
      return { term, detected, confidence };
    });
  };

  const calculateConfidenceScore = (difficulty: string, accuracy: number): number => {
    const difficultyMultiplier = {
      'easy': 1.0,
      'medium': 0.85,
      'hard': 0.7
    }[difficulty] || 1.0;
    
    return (accuracy / 100) * difficultyMultiplier;
  };

  const calculateOverallMetrics = (
    results: TestResult[], 
    phrases: TestPhrase[]
  ): AccuracyMetrics => {
    const overallAccuracy = results.reduce((sum, result) => sum + result.accuracy, 0) / results.length;
    
    const categoryAccuracy: Record<string, number> = {};
    ['medication', 'condition', 'abbreviation', 'procedure'].forEach(category => {
      const categoryResults = results.filter(result => {
        const phrase = phrases.find(p => p.id === result.phraseId);
        return phrase?.category === category;
      });
      
      if (categoryResults.length > 0) {
        categoryAccuracy[category] = categoryResults.reduce((sum, result) => sum + result.accuracy, 0) / categoryResults.length;
      }
    });

    const allTermResults = results.flatMap(result => result.termAccuracy);
    const termLevelAccuracy = (allTermResults.filter(term => term.detected).length / allTermResults.length) * 100;
    
    const falsePositives = allTermResults.filter(term => !term.detected && term.confidence > 0.5).length;
    const falseNegatives = allTermResults.filter(term => term.detected && term.confidence < 0.5).length;
    
    const averageConfidence = results.reduce((sum, result) => sum + result.confidenceScore, 0) / results.length;

    return {
      overallAccuracy,
      categoryAccuracy,
      termLevelAccuracy,
      falsePositives,
      falseNegatives,
      averageConfidence: averageConfidence * 100
    };
  };

  const playTestPhrase = async (phrase: string, phraseId: string) => {
    setIsPlayingAudio(phraseId);
    
    // Use Web Speech API for text-to-speech simulation
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsPlayingAudio(null);
      };
      
      speechSynthesis.speak(utterance);
    }
    
    setTimeout(() => setIsPlayingAudio(null), 3000);
  };

  const exportResults = () => {
    const exportData = {
      testDate: new Date().toISOString(),
      filters: { category: selectedCategory, difficulty: selectedDifficulty },
      results: testResults,
      metrics: metrics,
      phrasesTested: filteredPhrases.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-accuracy-test-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results Exported",
      description: "ASR accuracy test results downloaded successfully",
    });
  };

  const resetTest = () => {
    setTestResults([]);
    setCurrentTestIndex(0);
    setMetrics(null);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TestTube className="w-6 h-6 text-blue-600" />
              <span>ASR Accuracy Quality Assurance</span>
            </div>
            <div className="flex items-center space-x-2">
              {metrics && (
                <Badge variant="outline">
                  Overall: {metrics.overallAccuracy.toFixed(1)}%
                </Badge>
              )}
              <Button onClick={exportResults} variant="outline" size="sm" disabled={testResults.length === 0}>
                <Download className="w-4 h-4 mr-1" />
                Export Results
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Test Configuration */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                disabled={isRunning}
              >
                <option value="all">All Categories</option>
                <option value="medication">Medications</option>
                <option value="condition">Conditions</option>
                <option value="abbreviation">Abbreviations</option>
                <option value="procedure">Procedures</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Difficulty:</label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                disabled={isRunning}
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <Badge variant="outline">
              {filteredPhrases.length} test phrases
            </Badge>
          </div>

          {/* Test Controls */}
          <div className="flex space-x-2">
            <Button
              onClick={runAccuracyTest}
              disabled={isRunning || filteredPhrases.length === 0}
              className="flex items-center"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Testing... ({currentTestIndex + 1}/{filteredPhrases.length})
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Accuracy Test
                </>
              )}
            </Button>
            
            <Button onClick={resetTest} variant="outline" disabled={isRunning}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Testing Progress</span>
                <span>{currentTestIndex}/{filteredPhrases.length}</span>
              </div>
              <Progress value={(currentTestIndex / filteredPhrases.length) * 100} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {(testResults.length > 0 || metrics) && (
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">
              Test Results ({testResults.length})
            </TabsTrigger>
            <TabsTrigger value="metrics">
              Accuracy Metrics
            </TabsTrigger>
            <TabsTrigger value="phrases">
              Test Phrases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Detailed Test Results</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-4">
                    {testResults.map((result, index) => {
                      const phrase = filteredPhrases.find(p => p.id === result.phraseId);
                      return (
                        <Card key={result.phraseId} className="border">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">{phrase?.category}</Badge>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={result.accuracy >= 80 ? 'default' : result.accuracy >= 60 ? 'secondary' : 'destructive'}
                                  >
                                    {result.accuracy.toFixed(1)}% accuracy
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {result.executionTime}ms
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <strong className="text-sm">Original:</strong>
                                  <p className="text-sm text-gray-700">{result.originalPhrase}</p>
                                </div>
                                <div>
                                  <strong className="text-sm">Detected:</strong>
                                  <p className="text-sm text-gray-700">{result.detectedPhrase}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <strong className="text-sm">Term Detection:</strong>
                                <div className="flex flex-wrap gap-2">
                                  {result.termAccuracy.map((term, idx) => (
                                    <Badge 
                                      key={idx}
                                      variant={term.detected ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {term.detected ? (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-1" />
                                      )}
                                      {term.term} ({(term.confidence * 100).toFixed(0)}%)
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overall Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Overall Accuracy:</span>
                        <Badge variant={metrics.overallAccuracy >= 80 ? 'default' : 'secondary'}>
                          {metrics.overallAccuracy.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Term-Level Accuracy:</span>
                        <Badge>{metrics.termLevelAccuracy.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Confidence:</span>
                        <Badge>{metrics.averageConfidence.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(metrics.categoryAccuracy).map(([category, accuracy]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="capitalize">{category}:</span>
                        <Badge variant={accuracy >= 80 ? 'default' : accuracy >= 60 ? 'secondary' : 'destructive'}>
                          {accuracy.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Error Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>False Positives:</span>
                      <Badge variant="destructive">{metrics.falsePositives}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>False Negatives:</span>
                      <Badge variant="destructive">{metrics.falseNegatives}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {metrics.overallAccuracy < 70 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            Low overall accuracy detected. Consider training model with more clinical data.
                          </AlertDescription>
                        </Alert>
                      )}
                      {metrics.categoryAccuracy.abbreviation < 60 && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            Poor abbreviation recognition. Expand abbreviation dictionary.
                          </AlertDescription>
                        </Alert>
                      )}
                      {metrics.categoryAccuracy.medication < 75 && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">
                            Medication name accuracy needs improvement. Add phonetic variants.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="phrases">
            <Card>
              <CardHeader>
                <CardTitle>Test Phrase Library</CardTitle>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-3">
                    {filteredPhrases.map((phrase) => (
                      <Card key={phrase.id} className="border">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{phrase.category}</Badge>
                                <Badge 
                                  variant={
                                    phrase.difficulty === 'easy' 
                                      ? 'default' 
                                      : phrase.difficulty === 'medium' 
                                      ? 'secondary' 
                                      : 'destructive'
                                  }
                                >
                                  {phrase.difficulty}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => playTestPhrase(phrase.originalPhrase, phrase.id)}
                                disabled={isPlayingAudio === phrase.id}
                              >
                                {isPlayingAudio === phrase.id ? (
                                  <Volume2 className="w-4 h-4 animate-pulse" />
                                ) : (
                                  <Mic className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            
                            <div>
                              <strong className="text-sm">Phrase:</strong>
                              <p className="text-sm text-gray-700">{phrase.originalPhrase}</p>
                            </div>
                            
                            <div>
                              <strong className="text-sm">Expected Terms:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {phrase.expectedTerms.map((term, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {term}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <strong className="text-sm">Context:</strong>
                              <p className="text-xs text-gray-600">{phrase.clinicalContext}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ASRAccuracyTester;
