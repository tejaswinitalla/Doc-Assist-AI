
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, DollarSign, Zap, Shield, Globe } from 'lucide-react';

const ServiceComparison = () => {
  const services = [
    {
      name: 'Google Cloud Speech-to-Text Medical',
      provider: 'GCP',
      color: 'bg-blue-500',
      pricing: '$0.024/minute',
      features: {
        medicalVocabulary: true,
        realtimeTranscription: true,
        speakerDiarization: true,
        customModels: true,
        hipaaCompliant: true,
        multiLanguage: 125
      },
      pros: [
        'Extensive medical vocabulary',
        'High accuracy for clinical terms',
        'Real-time streaming support',
        'Custom model training'
      ],
      cons: [
        'Higher pricing for medical model',
        'Complex setup process'
      ],
      setup: 'Requires service account with Healthcare API access'
    },
    {
      name: 'AWS Transcribe Medical',
      provider: 'AWS',
      color: 'bg-orange-500',
      pricing: '$0.025/minute',
      features: {
        medicalVocabulary: true,
        realtimeTranscription: true,
        speakerDiarization: false,
        customModels: false,
        hipaaCompliant: true,
        multiLanguage: 1
      },
      pros: [
        'Purpose-built for medical transcription',
        'Automatic medical entity detection',
        'Easy AWS integration',
        'Batch processing support'
      ],
      cons: [
        'Limited language support',
        'No speaker diarization',
        'No custom model training'
      ],
      setup: 'IAM role with transcribe:StartMedicalTranscriptionJob'
    },
    {
      name: 'Azure Speech Medical',
      provider: 'Azure',
      color: 'bg-blue-600',
      pricing: '$0.020/minute',
      features: {
        medicalVocabulary: true,
        realtimeTranscription: true,
        speakerDiarization: true,
        customModels: true,
        hipaaCompliant: true,
        multiLanguage: 85
      },
      pros: [
        'Competitive pricing',
        'Good medical accuracy',
        'Custom speech models',
        'Integration with Healthcare APIs'
      ],
      cons: [
        'Newer service with less documentation',
        'Limited regional availability'
      ],
      setup: 'Speech service resource with medical endpoint access'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Medical ASR Service Comparison</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Comprehensive analysis of cloud speech-to-text services optimized for medical transcription
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <Card key={service.provider} className="medical-card hover:shadow-xl transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <div className={`w-3 h-3 rounded-full ${service.color}`}></div>
                <Badge variant="outline" className="text-xs">
                  {service.provider}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold text-medical-blue">{service.pricing}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-700">Key Features</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    {service.features.medicalVocabulary ? (
                      <CheckCircle className="w-3 h-3 text-medical-success" />
                    ) : (
                      <XCircle className="w-3 h-3 text-medical-error" />
                    )}
                    <span>Medical Vocab</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {service.features.realtimeTranscription ? (
                      <CheckCircle className="w-3 h-3 text-medical-success" />
                    ) : (
                      <XCircle className="w-3 h-3 text-medical-error" />
                    )}
                    <span>Real-time</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {service.features.speakerDiarization ? (
                      <CheckCircle className="w-3 h-3 text-medical-success" />
                    ) : (
                      <XCircle className="w-3 h-3 text-medical-error" />
                    )}
                    <span>Diarization</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {service.features.customModels ? (
                      <CheckCircle className="w-3 h-3 text-medical-success" />
                    ) : (
                      <XCircle className="w-3 h-3 text-medical-error" />
                    )}
                    <span>Custom Models</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-medical-success" />
                    <span>HIPAA</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3 text-medical-teal" />
                    <span>{service.features.multiLanguage} langs</span>
                  </div>
                </div>
              </div>

              {/* Pros */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-medical-success">Advantages</h4>
                <ul className="text-xs space-y-1">
                  {service.pros.map((pro, i) => (
                    <li key={i} className="flex items-start space-x-1">
                      <span className="text-medical-success mt-0.5">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-medical-error">Considerations</h4>
                <ul className="text-xs space-y-1">
                  {service.cons.map((con, i) => (
                    <li key={i} className="flex items-start space-x-1">
                      <span className="text-medical-error mt-0.5">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Setup */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-700">Setup Requirements</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{service.setup}</p>
              </div>

              <Button className="w-full" variant={index === 0 ? "default" : "outline"}>
                {index === 0 ? "Recommended Choice" : "Select Service"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Recommendation */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-medical-warning" />
            Recommendation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-medical-blue-light p-4 rounded-lg">
            <h4 className="font-semibold text-medical-blue mb-2">Primary Recommendation: Google Cloud Speech-to-Text Medical</h4>
            <p className="text-sm text-slate-700">
              Best overall choice for clinical applications due to comprehensive medical vocabulary, 
              real-time capabilities, and proven accuracy in healthcare environments. 
              Higher cost is justified by superior feature set and customization options.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold text-slate-700 mb-1">Next Steps:</h5>
              <ul className="space-y-1 text-slate-600">
                <li>• Set up GCP project with Healthcare APIs</li>
                <li>• Create service account with appropriate permissions</li>
                <li>• Configure medical vocabulary customization</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-slate-700 mb-1">Budget Alternative:</h5>
              <p className="text-slate-600">
                Azure Speech Medical offers competitive pricing with good medical accuracy, 
                making it suitable for cost-conscious implementations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceComparison;
