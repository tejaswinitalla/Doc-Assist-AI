
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TestTube, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  FileText,
  Download,
  Play,
  RefreshCw,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestCase {
  id: string;
  transcript: string;
  expectedAlerts: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    keywords: string[];
  }>;
  patientContext: {
    conditions: string[];
    medications: string[];
    demographics: {
      age: number;
      gender: string;
    };
  };
  description: string;
}

interface TestResult {
  testCaseId: string;
  detectedAlerts: any[];
  expectedAlerts: any[];
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  executionTime: number;
  status: 'passed' | 'failed' | 'warning';
}

interface ValidationMetrics {
  overallPrecision: number;
  overallRecall: number;
  overallF1Score: number;
  coverage: number;
  totalTestCases: number;
  passedTests: number;
  failedTests: number;
  averageExecutionTime: number;
}

const AIPipelineValidator: React.FC = () => {
  const [testCases] = useState<TestCase[]>([
    {
      id: 'sepsis-case-1',
      transcript: 'Patient presents with fever 102.3F, heart rate 125, blood pressure 85/60, confusion, and possible infection. White blood cell count elevated at 18,000.',
      expectedAlerts: [
        { type: 'sepsis', severity: 'critical', keywords: ['fever', 'tachycardia', 'hypotension', 'confusion'] }
      ],
      patientContext: {
        conditions: ['pneumonia'],
        medications: ['antibiotics'],
        demographics: { age: 67, gender: 'female' }
      },
      description: 'Sepsis recognition with vital signs and clinical presentation'
    },
    {
      id: 'drug-interaction-1',
      transcript: 'Prescribing warfarin 5mg daily. Patient already taking aspirin 81mg for cardioprotection.',
      expectedAlerts: [
        { type: 'medication_conflict', severity: 'critical', keywords: ['warfarin', 'aspirin', 'bleeding risk'] }
      ],
      patientContext: {
        conditions: ['atrial fibrillation', 'coronary artery disease'],
        medications: ['aspirin', 'warfarin'],
        demographics: { age: 74, gender: 'male' }
      },
      description: 'Critical drug interaction between anticoagulants'
    },
    {
      id: 'uncontrolled-diabetes-1',
      transcript: 'HbA1c result came back at 10.2%. Patient reports frequent urination and excessive thirst. Current on metformin 1000mg twice daily.',
      expectedAlerts: [
        { type: 'contraindication', severity: 'critical', keywords: ['hba1c', 'uncontrolled diabetes'] }
      ],
      patientContext: {
        conditions: ['type 2 diabetes', 'hypertension'],
        medications: ['metformin', 'lisinopril'],
        demographics: { age: 58, gender: 'female' }
      },
      description: 'Uncontrolled diabetes requiring intervention'
    },
    {
      id: 'hypertensive-crisis-1',
      transcript: 'Blood pressure reading 195/115. Patient complaining of severe headache and visual changes. Currently on lisinopril and amlodipine.',
      expectedAlerts: [
        { type: 'contraindication', severity: 'critical', keywords: ['hypertensive crisis', 'blood pressure'] }
      ],
      patientContext: {
        conditions: ['hypertension', 'left ventricular hypertrophy'],
        medications: ['lisinopril', 'amlodipine'],
        demographics: { age: 62, gender: 'male' }
      },
      description: 'Hypertensive crisis requiring immediate intervention'
    },
    {
      id: 'allergy-alert-1',
      transcript: 'Planning to start patient on amoxicillin for pneumonia treatment.',
      expectedAlerts: [
        { type: 'allergy', severity: 'critical', keywords: ['penicillin allergy', 'amoxicillin'] }
      ],
      patientContext: {
        conditions: ['pneumonia', 'penicillin allergy'],
        medications: [],
        demographics: { age: 45, gender: 'female' }
      },
      description: 'Medication allergy prevention'
    }
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const { toast } = useToast();

  const runValidationSuite = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTestIndex(0);

    const results: TestResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      setCurrentTestIndex(i);
      const testCase = testCases[i];
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const startTime = Date.now();
      
      // Simulate alert detection (replace with actual AI service call)
      const detectedAlerts = await simulateAlertDetection(testCase);
      
      const executionTime = Date.now() - startTime;
      
      // Calculate metrics
      const result = calculateTestMetrics(testCase, detectedAlerts, executionTime);
      results.push(result);
      setTestResults([...results]);
    }

    // Calculate overall metrics
    const metrics = calculateOverallMetrics(results);
    setValidationMetrics(metrics);
    setIsRunning(false);

    toast({
      title: "Validation Complete",
      description: `Processed ${testCases.length} test cases. Overall F1 Score: ${(metrics.overallF1Score * 100).toFixed(1)}%`,
    });
  };

  const simulateAlertDetection = async (testCase: TestCase): Promise<any[]> => {
    // This would be replaced with actual AI service calls
    const detectedAlerts: any[] = [];
    
    // Simulate detection logic based on transcript content
    const lowerTranscript = testCase.transcript.toLowerCase();
    
    // Sepsis detection
    if (lowerTranscript.includes('fever') && lowerTranscript.includes('confusion')) {
      detectedAlerts.push({
        type: 'sepsis',
        severity: 'critical',
        confidence: 0.85,
        detectedKeywords: ['fever', 'confusion']
      });
    }
    
    // Drug interaction detection
    if (lowerTranscript.includes('warfarin') && lowerTranscript.includes('aspirin')) {
      detectedAlerts.push({
        type: 'medication_conflict',
        severity: 'critical',
        confidence: 0.92,
        detectedKeywords: ['warfarin', 'aspirin']
      });
    }
    
    // Diabetes detection
    if (lowerTranscript.includes('hba1c')) {
      const hba1cMatch = lowerTranscript.match(/hba1c.*?(\d+\.?\d*)/);
      if (hba1cMatch && parseFloat(hba1cMatch[1]) > 8) {
        detectedAlerts.push({
          type: 'contraindication',
          severity: 'critical',
          confidence: 0.88,
          detectedKeywords: ['hba1c', 'uncontrolled diabetes']
        });
      }
    }
    
    // Blood pressure detection
    const bpMatch = lowerTranscript.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      const diastolic = parseInt(bpMatch[2]);
      if (systolic >= 180 || diastolic >= 110) {
        detectedAlerts.push({
          type: 'contraindication',
          severity: 'critical',
          confidence: 0.90,
          detectedKeywords: ['blood pressure', 'hypertensive crisis']
        });
      }
    }
    
    return detectedAlerts;
  };

  const calculateTestMetrics = (
    testCase: TestCase, 
    detectedAlerts: any[], 
    executionTime: number
  ): TestResult => {
    const expectedTypes = testCase.expectedAlerts.map(alert => alert.type);
    const detectedTypes = detectedAlerts.map(alert => alert.type);
    
    const truePositives = expectedTypes.filter(type => detectedTypes.includes(type)).length;
    const falsePositives = detectedTypes.filter(type => !expectedTypes.includes(type)).length;
    const falseNegatives = expectedTypes.filter(type => !detectedTypes.includes(type)).length;
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    const status: 'passed' | 'failed' | 'warning' = 
      f1Score >= 0.8 ? 'passed' : 
      f1Score >= 0.6 ? 'warning' : 'failed';

    return {
      testCaseId: testCase.id,
      detectedAlerts,
      expectedAlerts: testCase.expectedAlerts,
      truePositives,
      falsePositives,
      falseNegatives,
      precision,
      recall,
      f1Score,
      executionTime,
      status
    };
  };

  const calculateOverallMetrics = (results: TestResult[]): ValidationMetrics => {
    const totalTP = results.reduce((sum, result) => sum + result.truePositives, 0);
    const totalFP = results.reduce((sum, result) => sum + result.falsePositives, 0);
    const totalFN = results.reduce((sum, result) => sum + result.falseNegatives, 0);
    
    const overallPrecision = totalTP / (totalTP + totalFP) || 0;
    const overallRecall = totalTP / (totalTP + totalFN) || 0;
    const overallF1Score = 2 * (overallPrecision * overallRecall) / (overallPrecision + overallRecall) || 0;
    
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const coverage = passedTests / results.length || 0;
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length || 0;

    return {
      overallPrecision,
      overallRecall,
      overallF1Score,
      coverage,
      totalTestCases: results.length,
      passedTests,
      failedTests,
      averageExecutionTime
    };
  };

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics: validationMetrics,
      testResults: testResults,
      testCases: testCases
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-pipeline-validation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results Exported",
      description: "Validation results downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TestTube className="w-6 h-6 text-blue-600" />
              <span>AI Pipeline Validator</span>
              {validationMetrics && (
                <Badge className="bg-blue-600">
                  F1: {(validationMetrics.overallF1Score * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={runValidationSuite}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Validation
                  </>
                )}
              </Button>
              {validationMetrics && (
                <Button onClick={exportResults} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isRunning && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Testing Progress</span>
                <span>{currentTestIndex + 1} of {testCases.length}</span>
              </div>
              <Progress value={(currentTestIndex / testCases.length) * 100} className="h-2" />
              <p className="text-sm text-gray-500">
                Currently testing: {testCases[currentTestIndex]?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Overall Metrics</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="cases">Test Cases</TabsTrigger>
          <TabsTrigger value="insights">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          {validationMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">
                    {(validationMetrics.overallPrecision * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Precision</div>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {(validationMetrics.overallRecall * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Recall</div>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">
                    {(validationMetrics.overallF1Score * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">F1 Score</div>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">
                    {(validationMetrics.coverage * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Coverage</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Run validation to see metrics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div
                      key={result.testCaseId}
                      className={`p-4 rounded-lg border ${
                        result.status === 'passed' ? 'bg-green-50 border-green-200' :
                        result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {result.status === 'passed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : result.status === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium">{result.testCaseId}</span>
                        </div>
                        <div className="flex space-x-2 text-sm">
                          <Badge variant="outline">F1: {(result.f1Score * 100).toFixed(1)}%</Badge>
                          <Badge variant="outline">{result.executionTime}ms</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">TP:</span> {result.truePositives}
                        </div>
                        <div>
                          <span className="text-gray-600">FP:</span> {result.falsePositives}
                        </div>
                        <div>
                          <span className="text-gray-600">FN:</span> {result.falseNegatives}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle>Test Case Library</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {testCases.map((testCase) => (
                    <div key={testCase.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{testCase.description}</h4>
                      <p className="text-sm text-gray-600 mb-3">{testCase.transcript}</p>
                      <div className="flex flex-wrap gap-2">
                        {testCase.expectedAlerts.map((alert, index) => (
                          <Badge key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            {alert.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-4">
            {validationMetrics && (
              <>
                <Alert className="border-blue-200 bg-blue-50">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Performance Summary:</strong> The AI pipeline achieved {(validationMetrics.overallF1Score * 100).toFixed(1)}% F1 score 
                    across {validationMetrics.totalTestCases} test cases, with {validationMetrics.passedTests} passed 
                    and {validationMetrics.failedTests} failed tests.
                  </AlertDescription>
                </Alert>
                
                {validationMetrics.overallF1Score < 0.8 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Improvement Needed:</strong> F1 score below 80% threshold. 
                      Consider tuning alert thresholds or expanding training data.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPipelineValidator;
