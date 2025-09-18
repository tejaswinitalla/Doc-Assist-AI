
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, Star, TrendingUp, DollarSign, Clock, Mic } from 'lucide-react';

const ServiceComparison = () => {
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    {
      id: 'gcp',
      name: 'Google Cloud Speech-to-Text',
      medicalModel: 'Medical Conversation',
      accuracy: 92,
      latency: 150,
      cost: 0.006,
      languages: 125,
      diarization: true,
      streaming: true,
      medicalTerms: true,
      compliance: ['HIPAA', 'SOC 2'],
      pros: [
        'Excellent medical vocabulary',
        'Real-time streaming',
        'Speaker diarization',
        'Multi-language support'
      ],
      cons: [
        'Higher cost for medical model',
        'Requires GCP setup'
      ],
      useCase: 'Best for comprehensive medical conversations with multiple speakers',
      apiComplexity: 'Medium',
      documentation: 'Excellent',
      reliability: 95
    },
    {
      id: 'aws',
      name: 'AWS Transcribe Medical',
      medicalModel: 'Primary Care & Cardiology',
      accuracy: 94,
      latency: 200,
      cost: 0.004,
      languages: 31,
      diarization: true,
      streaming: true,
      medicalTerms: true,
      compliance: ['HIPAA', 'HITRUST'],
      pros: [
        'Purpose-built for medical',
        'Specialty-specific models',
        'Lower cost',
        'HITRUST certified'
      ],
      cons: [
        'Limited languages',
        'AWS ecosystem dependency'
      ],
      useCase: 'Ideal for specialized medical consultations',
      apiComplexity: 'Low',
      documentation: 'Good',
      reliability: 97
    },
    {
      id: 'speechmatics',
      name: 'Speechmatics Medical',
      medicalModel: 'Enhanced Medical',
      accuracy: 89,
      latency: 120,
      cost: 0.005,
      languages: 50,
      diarization: true,
      streaming: true,
      medicalTerms: true,
      compliance: ['GDPR', 'ISO 27001'],
      pros: [
        'Fastest real-time processing',
        'Good accuracy/cost ratio',
        'European data residency',
        'Custom vocabulary support'
      ],
      cons: [
        'Smaller market presence',
        'Limited specialty models'
      ],
      useCase: 'Great for real-time applications requiring low latency',
      apiComplexity: 'Medium',
      documentation: 'Good',
      reliability: 93
    }
  ];

  const getRecommendation = () => {
    // Simple scoring algorithm based on your use case
    const scores = services.map(service => ({
      ...service,
      score: (
        service.accuracy * 0.3 +
        (100 - service.latency / 10) * 0.25 +
        (10 - service.cost * 1000) * 0.15 +
        service.reliability * 0.2 +
        (service.apiComplexity === 'Low' ? 10 : service.apiComplexity === 'Medium' ? 7 : 5) * 0.1
      )
    }));
    
    return scores.sort((a, b) => b.score - a.score)[0];
  };

  const recommended = getRecommendation();

  const ComparisonMatrix = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-slate-300">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-300 p-3 text-left font-semibold">Criteria</th>
            {services.map(service => (
              <th key={service.id} className="border border-slate-300 p-3 text-center font-semibold min-w-[200px]">
                {service.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">Medical Accuracy</td>
            {services.map(service => (
              <td key={service.id} className="border border-slate-300 p-3 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg font-bold">{service.accuracy}%</span>
                  <Progress value={service.accuracy} className="w-16" />
                </div>
              </td>
            ))}
          </tr>
          <tr className="bg-slate-25">
            <td className="border border-slate-300 p-3 font-medium">Latency (ms)</td>
            {services.map(service => (
              <td key={service.id} className="border border-slate-300 p-3 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="w-4 h-4 text-medical-blue" />
                  <span className="font-semibold">{service.latency}ms</span>
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">Cost per minute</td>
            {services.map(service => (
              <td key={service.id} className="border border-slate-300 p-3 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <DollarSign className="w-4 h-4 text-medical-teal" />
                  <span className="font-semibold">${service.cost}</span>
                </div>
              </td>
            ))}
          </tr>
          <tr className="bg-slate-25">
            <td className="border border-slate-300 p-3 font-medium">Language Support</td>
            {services.map(service => (
              <td key={service.id} className="border border-slate-300 p-3 text-center">
                <span className="font-semibold">{service.languages} languages</span>
              </td>
            ))}
          </tr>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">Speaker Diarization</td>
            {services.map(service => (
              <td key={service.id} className="border border-slate-300 p-3 text-center">
                {service.diarization ? (
                  <CheckCircle className="w-5 h-5 text-medical-success mx-auto" />
                ) : (
                  <XCircle className="w-5 h-5 text-medical-error mx-auto" />
                )}
              </td>
            ))}
          </tr>
          <tr className="bg-slate-25">
            <td className="border border-slate-300 p-3 font-medium">Real-time Streaming</td>
            {services.map(service => (
              <td key={service.id} className="border border-slate-300 p-3 text-center">
                {service.streaming ? (
                  <CheckCircle className="w-5 h-5 text-medical-success mx-auto" />
                ) : (
                  <XCircle className="w-5 h-5 text-medical-error mx-auto" />
                )}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">Compliance</td>
            {services.map(service => (
              <td key={service.id} className="border border-slate-300 p-3 text-center">
                <div className="flex flex-wrap gap-1 justify-center">
                  {service.compliance.map(cert => (
                    <Badge key={cert} variant="secondary" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Recommendation Card */}
      <Card className="medical-card border-medical-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-6 h-6 text-medical-warning" />
            <span>Recommended Service</span>
          </CardTitle>
          <CardDescription>
            Based on your medical ASR requirements and prototype goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-medical-blue">{recommended.name}</h3>
              <p className="text-slate-600">{recommended.useCase}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-medical-success" />
                  <span>{recommended.accuracy}% accuracy</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-medical-blue" />
                  <span>{recommended.latency}ms latency</span>
                </span>
                <span className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-medical-teal" />
                  <span>${recommended.cost}/min</span>
                </span>
              </div>
            </div>
            <Badge className="bg-medical-warning text-white">
              Recommended
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">Comparison Matrix</TabsTrigger>
          <TabsTrigger value="details">Service Details</TabsTrigger>
          <TabsTrigger value="implementation">Implementation Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Comparison Matrix</CardTitle>
              <CardDescription>
                Detailed comparison of medical ASR services across key criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            {services.map(service => (
              <Card key={service.id} className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{service.name}</span>
                    {service.id === recommended.id && (
                      <Badge className="bg-medical-warning text-white">Recommended</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{service.medicalModel} Model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-medical-blue">{service.accuracy}%</div>
                      <div className="text-sm text-slate-600">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-medical-teal">{service.latency}ms</div>
                      <div className="text-sm text-slate-600">Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-medical-success">${service.cost}</div>
                      <div className="text-sm text-slate-600">Per minute</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-medical-blue">{service.reliability}%</div>
                      <div className="text-sm text-slate-600">Reliability</div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-medical-success mb-2">Pros</h4>
                      <ul className="space-y-1">
                        {service.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-medical-success mt-0.5 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-medical-error mb-2">Cons</h4>
                      <ul className="space-y-1">
                        {service.cons.map((con, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-medical-error mt-0.5 flex-shrink-0" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Next Steps for {recommended.name}</CardTitle>
              <CardDescription>
                Ready to implement? Here's your Tuesday roadmap for the streaming POC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-blue text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">API Setup</h4>
                    <p className="text-sm text-slate-600">Configure {recommended.name} credentials and enable medical model</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-teal text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">WebSocket Server</h4>
                    <p className="text-sm text-slate-600">Initialize Node.js server with streaming capabilities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-success text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Audio Capture</h4>
                    <p className="text-sm text-slate-600">Implement browser audio capture with 100ms chunking</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-medical-warning text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold">Speaker Diarization</h4>
                    <p className="text-sm text-slate-600">Enable speaker separation for medical conversations</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-2">Key Configuration for {recommended.name}:</h4>
                <ul className="text-sm space-y-1 text-slate-600">
                  <li>• Medical model: {recommended.medicalModel}</li>
                  <li>• Sample rate: 16kHz</li>
                  <li>• Audio format: LINEAR16</li>
                  <li>• Enable interim results: true</li>
                  <li>• Speaker diarization: enabled</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceComparison;
