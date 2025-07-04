
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Terminal, FileText, Play, CheckCircle, Copy, Mic, MicOff, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VoiceInteractionWidget from './VoiceInteractionWidget';
import NLPDockerTester from './NLPDockerTester';

const ImplementationGuide = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({
      title: "Code copied!",
      description: "Code has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-medical-success" />
            <span>Voice Interaction + AI Clinical Alert System</span>
          </CardTitle>
          <CardDescription>
            Complete voice-driven clinical workflow with real-time safety alerts and FHIR integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🎙️ Voice Interaction</h4>
              <p className="text-sm text-slate-600">Web Speech API with voice commands and real-time transcription</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🚨 Clinical Alerts</h4>
              <p className="text-sm text-slate-600">AI-powered safety detection with acknowledge/override workflow</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">📋 FHIR Integration</h4>
              <p className="text-sm text-slate-600">Automated clinical note generation with structured data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="live-demo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live-demo">Live Demo</TabsTrigger>
          <TabsTrigger value="voice-features">Voice Features</TabsTrigger>
          <TabsTrigger value="alert-system">Alert System</TabsTrigger>
          <TabsTrigger value="docker">Docker Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="live-demo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-6 h-6 text-medical-blue" />
                <span>Complete Voice Clinical Assistant</span>
              </CardTitle>
              <CardDescription>
                Full-featured voice interaction system with clinical alerts and FHIR generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">✨ Features Implemented:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                    <div>✓ Real-time speech recognition</div>
                    <div>✓ Voice command detection</div>
                    <div>✓ Clinical safety alerts</div>
                    <div>✓ Alert acknowledgment/override</div>
                    <div>✓ Microphone status indicators</div>
                    <div>✓ FHIR document generation</div>
                    <div>✓ Session data export</div>
                    <div>✓ Test data simulation</div>
                  </div>
                </div>

                <VoiceInteractionWidget />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice-features">
          <Card>
            <CardHeader>
              <CardTitle>🎙️ Voice Interaction Features</CardTitle>
              <CardDescription>
                Microphone controls, voice commands, and UX enhancements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Voice Commands Supported:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>"Repeat that"</strong> → Replays last transcript
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>"Pause listening"</strong> → Mutes microphone
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>"Resume listening"</strong> → Reactivates microphone
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>"Clear transcript"</strong> → Clears history
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Microphone Status Indicators:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Listening - Active recording</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Processing - Analyzing speech</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Muted - Paused by user</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Error - Connection issue</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">UX Best Practices:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Interim text appears grayed out with smooth animations</li>
                    <li>• Volume indicators show audio input levels</li>
                    <li>• Auto-scroll keeps latest content visible</li>
                    <li>• Error states provide clear feedback</li>
                    <li>• Works offline with Web Speech API</li>
                    <li>• Optimized for clinical environments</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alert-system">
          <Card>
            <CardHeader>
              <CardTitle>🚨 AI Clinical Alert System</CardTitle>
              <CardDescription>
                Safety trigger detection with source citations and response tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Alert Triggers (Critical):</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="font-medium text-red-800">Sepsis Detection</div>
                        <div className="text-red-600">Keywords: sepsis, septic shock, blood infection</div>
                        <div className="text-xs text-red-500">Source: NICE Guideline NG51</div>
                      </div>
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="font-medium text-red-800">Contraindications</div>
                        <div className="text-red-600">Keywords: contraindicated, should not take</div>
                        <div className="text-xs text-red-500">Source: BMJ Clinical Guidelines</div>
                      </div>
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="font-medium text-red-800">Drug Interactions</div>
                        <div className="text-red-600">Keywords: drug interaction, dangerous combination</div>
                        <div className="text-xs text-red-500">Source: FDA Drug Database</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Alert Triggers (Caution):</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="font-medium text-yellow-800">Allergy Alerts</div>
                        <div className="text-yellow-600">Keywords: allergic to, adverse reaction</div>
                        <div className="text-xs text-yellow-500">Source: Clinical Safety Guidelines</div>
                      </div>
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="font-medium text-yellow-800">Dosage Errors</div>
                        <div className="text-yellow-600">Keywords: overdose, exceeded dose</div>
                        <div className="text-xs text-yellow-500">Source: Pharmacy Guidelines</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Response Workflow:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <div className="font-medium">Acknowledge Action:</div>
                      <div>• One-click acknowledgment</div>
                      <div>• Timestamp recorded</div>
                      <div>• Alert marked as seen</div>
                    </div>
                    <div>
                      <div className="font-medium">Override Action:</div>
                      <div>• Required comment field</div>
                      <div>• Reason for override captured</div>
                      <div>• Full audit trail maintained</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Data Export & Compliance:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Complete session export in JSON format</li>
                    <li>• All user responses tracked with timestamps</li>
                    <li>• Source citations included for audit trail</li>
                    <li>• FHIR-compliant data structure</li>
                    <li>• Ready for integration with EMR systems</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docker">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🔸 NLP Service Integration</CardTitle>
                <CardDescription>
                  Docker container setup and API testing for enhanced NLP processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NLPDockerTester />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImplementationGuide;
