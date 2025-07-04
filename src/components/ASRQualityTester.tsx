
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  Play, 
  BarChart3, 
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestPhrase {
  id: string;
  category: 'medication' | 'condition' | 'procedure' | 'abbreviation';
  expectedText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

interface TestResult {
  id: string;
  phraseId: string;
  expectedText: string;
  actualText: string;
  accuracy: number;
  wer: number; // Word Error Rate
  timestamp: Date;
  category: string;
}

interface AccuracyStats {
  overall: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  totalTests: number;
}

const ASRQualityTester: React.FC = () => {
  const [testPhrases] = useState<TestPhrase[]>([
    // Medications
    {
      id: 'med-001',
      category: 'medication',
      expectedText: 'Patient is taking lisinopril ten milligrams daily',
      difficulty: 'easy',
      description: 'Common ACE inhibitor medication'
    },
    {
      id: 'med-002',
      category: 'medication',
      expectedText: 'Prescribed atorvastatin forty milligrams for hyperlipidemia',
      difficulty: 'medium',
      description: 'Statin medication with medical condition'
    },
    {
      id: 'med-003',
      category: 'medication',
      expectedText: 'Administered epinephrine zero point three milligrams intramuscularly',
      difficulty: 'hard',
      description: 'Emergency medication with complex dosing'
    },
    
    // Medical Conditions
    {
      id: 'cond-001',
      category: 'condition',
      expectedText: 'Patient presents with acute myocardial infarction',
      difficulty: 'medium',
      description: 'Heart attack medical terminology'
    },
    {
      id: 'cond-002',
      category: 'condition',
      expectedText: 'Diagnosis of chronic obstructive pulmonary disease exacerbation',
      difficulty: 'hard',
      description: 'Complex respiratory condition'
    },
    {
      id: 'cond-003',
      category: 'condition',
      expectedText: 'Patient has pneumonia with sepsis',
      difficulty: 'easy',
      description: 'Common infectious conditions'
    },
    
    // Procedures
    {
      id: 'proc-001',
      category: 'procedure',
      expectedText: 'Performed electrocardiogram and chest X-ray',
      difficulty: 'medium',
      description: 'Common diagnostic procedures'
    },
    {
      id: 'proc-002',
      category: 'procedure',
      expectedText: 'Scheduled for percutaneous coronary intervention',
      difficulty: 'hard',
      description: 'Complex cardiac procedure'
    },
    
    // Medical Abbreviations
    {
      id: 'abbr-001',
      category: 'abbreviation',
      expectedText: 'BP is one forty over ninety, HR seventy-two, O2 sat ninety-eight percent',
      difficulty: 'medium',
      description: 'Vital signs with abbreviations'
    },
    {
      id: 'abbr-002',
      category: 'abbreviation',
      expectedText: 'CBC shows WBC twelve thousand, Hgb eight point five',
      difficulty: 'hard',
      description: 'Lab values with medical abbreviations'
    }
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<TestPhrase | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [simulatedTranscript, setSimulatedTranscript] = useState('');
  
  const { toast } = useToast();

  // Calculate Word Error Rate (WER)
  const calculateWER = (expected: string, actual: string): number => {
    const expectedWords = expected.toLowerCase().split(/\s+/);
    const actualWords = actual.toLowerCase().split(/\s+/);
    
    // Simple Levenshtein distance for WER calculation
    const matrix = Array(expectedWords.length + 1).fill(null).map(() => 
      Array(actualWords.length + 1).fill(null)
    );
    
    for (let i = 0; i <= expectedWords.length; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= actualWords.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= expectedWords.length; i++) {
      for (let j = 1; j <= actualWords.length; j++) {
        const cost = expectedWords[i - 1] === actualWords[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const wer = (matrix[expectedWords.length][actualWords.length] / expectedWords.length) * 100;
    return Math.round(wer * 100) / 100;
  };

  // Calculate overall accuracy
  const calculateAccuracy = (expected: string, actual: string): number => {
    const wer = calculateWER(expected, actual);
    return Math.max(0, 100 - wer);
  };

  // Simulate ASR transcription (replace with actual ASR)
  const simulateASR = (phrase: TestPhrase): string => {
    // Simulate varying accuracy based on difficulty
    const accuracyRates = { easy: 0.95, medium: 0.85, hard: 0.70 };
    const targetAccuracy = accuracyRates[phrase.difficulty];
    
    const words = phrase.expectedText.split(' ');
    const simulatedWords = words.map(word => {
      if (Math.random() > targetAccuracy) {
        // Simulate common ASR errors
        const errors = [
          word.slice(0, -1), // Missing last letter
          word + 's', // Extra 's'
          word.replace(/[aeiou]/g, 'a'), // Vowel confusion
          'um' // Filler word
        ];
        return errors[Math.floor(Math.random() * errors.length)];
      }
      return word;
    });
    
    return simulatedWords.join(' ');
  };

  const startTest = (phrase: TestPhrase) => {
    setCurrentTest(phrase);
    setIsRecording(true);
    
    // Simulate recording delay
    setTimeout(() => {
      const simulatedResult = simulateASR(phrase);
      setSimulatedTranscript(simulatedResult);
      setIsRecording(false);
      
      // Calculate metrics
      const accuracy = calculateAccuracy(phrase.expectedText, simulatedResult);
      const wer = calculateWER(phrase.expectedText, simulatedResult);
      
      const testResult: TestResult = {
        id: `result-${Date.now()}`,
        phraseId: phrase.id,
        expectedText: phrase.expectedText,
        actualText: simulatedResult,
        accuracy,
        wer,
        timestamp: new Date(),
        category: phrase.category
      };
      
      setTestResults(prev => [testResult, ...prev]);
      
      toast({
        title: "Test Completed",
        description: `Accuracy: ${accuracy.toFixed(1)}%, WER: ${wer.toFixed(1)}%`,
        variant: accuracy > 80 ? "default" : "destructive"
      });
    }, 2000);
  };

  const calculateStats = (): AccuracyStats => {
    if (testResults.length === 0) {
      return {
        overall: 0,
        byCategory: {},
        byDifficulty: {},
        totalTests: 0
      };
    }

    const overall = testResults.reduce((sum, result) => sum + result.accuracy, 0) / testResults.length;
    
    const byCategory: Record<string, number> = {};
    const categoryGroups = testResults.reduce((groups, result) => {
      if (!groups[result.category]) groups[result.category] = [];
      groups[result.category].push(result.accuracy);
      return groups;
    }, {} as Record<string, number[]>);
    
    Object.keys(categoryGroups).forEach(category => {
      byCategory[category] = categoryGroups[category].reduce((sum, acc) => sum + acc, 0) / categoryGroups[category].length;
    });

    // Calculate by difficulty (match with test phrases)
    const byDifficulty: Record<string, number> = {};
    const difficultyGroups = testResults.reduce((groups, result) => {
      const phrase = testPhrases.find(p => p.id === result.phraseId);
      if (phrase) {
        if (!groups[phrase.difficulty]) groups[phrase.difficulty] = [];
        groups[phrase.difficulty].push(result.accuracy);
      }
      return groups;
    }, {} as Record<string, number[]>);
    
    Object.keys(difficultyGroups).forEach(difficulty => {
      byDifficulty[difficulty] = difficultyGroups[difficulty].reduce((sum, acc) => sum + acc, 0) / difficultyGroups[difficulty].length;
    });

    return {
      overall,
      byCategory,
      byDifficulty,
      totalTests: testResults.length
    };
  };

  const stats = calculateStats();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medication': return 'bg-blue-100 text-blue-800';
      case 'condition': return 'bg-red-100 text-red-800';
      case 'procedure': return 'bg-purple-100 text-purple-800';
      case 'abbreviation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span>ASR Quality Testing</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50 mb-6">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Quality Assurance:</strong> Test ASR accuracy across different medical terminology categories.
              Results help improve recognition of challenging clinical terms.
            </AlertDescription>
          </Alert>

          {/* Stats Overview */}
          {stats.totalTests > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.overall.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Overall Accuracy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalTests}</div>
                  <div className="text-sm text-gray-600">Tests Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(stats.byCategory).length}
                  </div>
                  <div className="text-sm text-gray-600">Categories Tested</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.byDifficulty.hard ? stats.byDifficulty.hard.toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Hard Terms Accuracy</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">Run Tests</TabsTrigger>
          <TabsTrigger value="results">Results ({testResults.length})</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {testPhrases.map((phrase) => (
                    <Card key={phrase.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getCategoryColor(phrase.category)}>
                                {phrase.category}
                              </Badge>
                              <Badge className={getDifficultyColor(phrase.difficulty)}>
                                {phrase.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{phrase.description}</p>
                            <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                              "{phrase.expectedText}"
                            </p>
                          </div>
                          <Button
                            onClick={() => startTest(phrase)}
                            disabled={isRecording}
                            size="sm"
                            className="ml-4"
                          >
                            {isRecording && currentTest?.id === phrase.id ? (
                              <>
                                <Mic className="w-4 h-4 mr-2 animate-pulse" />
                                Recording...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Test
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {currentTest?.id === phrase.id && simulatedTranscript && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <h4 className="font-medium text-yellow-800 mb-2">ASR Result:</h4>
                            <p className="font-mono text-sm text-yellow-900">"{simulatedTranscript}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {testResults.map((result) => {
                    const phrase = testPhrases.find(p => p.id === result.phraseId);
                    return (
                      <Card key={result.id} className="border">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {result.accuracy > 80 ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : result.accuracy > 60 ? (
                                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <Badge className={getCategoryColor(result.category)}>
                                  {result.category}
                                </Badge>
                                {phrase && (
                                  <Badge className={getDifficultyColor(phrase.difficulty)}>
                                    {phrase.difficulty}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm">
                                <span>Accuracy: <strong>{result.accuracy.toFixed(1)}%</strong></span>
                                <span>WER: <strong>{result.wer.toFixed(1)}%</strong></span>
                                <span className="text-gray-500">{result.timestamp.toLocaleTimeString()}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium text-gray-600">Expected:</span>
                                <p className="font-mono text-sm bg-green-50 p-2 rounded mt-1">
                                  "{result.expectedText}"
                                </p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Actual:</span>
                                <p className="font-mono text-sm bg-red-50 p-2 rounded mt-1">
                                  "{result.actualText}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {testResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No test results yet</p>
                      <p className="text-sm mt-2">Run some tests to see accuracy results</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byCategory).map(([category, accuracy]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <Badge className={getCategoryColor(category)}>{category}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, accuracy)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance by Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byDifficulty).map(([difficulty, accuracy]) => (
                    <div key={difficulty} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, accuracy)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Medical Abbreviations:</strong> Consider adding a custom dictionary for common medical abbreviations (CBC, WBC, BP, HR, etc.)
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Drug Names:</strong> Implement pharmaceutical name pronunciation models for better medication recognition
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Complex Procedures:</strong> Consider context-aware recognition for multi-word medical procedures
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ASRQualityTester;
