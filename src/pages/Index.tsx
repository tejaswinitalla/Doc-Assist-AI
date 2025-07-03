
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, CloudIcon, TestTube, BarChart3, Upload, Play, Pause, Activity, Code } from 'lucide-react';
import ServiceComparison from '../components/ServiceComparison';
import AudioTesting from '../components/AudioTesting';
import BenchmarkResults from '../components/BenchmarkResults';
import ImplementationGuide from '../components/ImplementationGuide';

const Index = () => {
  const [activeTab, setActiveTab] = useState('comparison');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 medical-gradient rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Clinical Voice Insights</h1>
                <p className="text-sm text-slate-600">Medical Speech-to-Text Integration Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-medical-blue-light text-medical-blue">
                <Activity className="w-3 h-3 mr-1" />
                Development Environment
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="medical-card hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <CloudIcon className="w-5 h-5 mr-2 text-medical-blue" />
                Service Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Compare GCP, AWS, and Azure medical ASR services</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-medical-blue">3</span>
                <span className="text-sm text-slate-500">Providers</span>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <TestTube className="w-5 h-5 mr-2 text-medical-teal" />
                Audio Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Upload and transcribe clinical audio samples</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-medical-teal">≤15%</span>
                <span className="text-sm text-slate-500">Target WER</span>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="w-5 h-5 mr-2 text-medical-success" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Latency and accuracy benchmarks</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-medical-success">&lt;2s</span>
                <span className="text-sm text-slate-500">Target Latency</span>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Code className="w-5 h-5 mr-2 text-medical-warning" />
                Implementation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Sprint progress and code examples</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-medical-warning">5</span>
                <span className="text-sm text-slate-500">Days Sprint</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="comparison" className="data-[state=active]:bg-medical-blue data-[state=active]:text-white">
              Service Comparison
            </TabsTrigger>
            <TabsTrigger value="implementation" className="data-[state=active]:bg-medical-warning data-[state=active]:text-white">
              Implementation Guide
            </TabsTrigger>
            <TabsTrigger value="testing" className="data-[state=active]:bg-medical-teal data-[state=active]:text-white">
              Audio Testing
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="data-[state=active]:bg-medical-success data-[state=active]:text-white">
              Benchmarks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <ServiceComparison />
          </TabsContent>

          <TabsContent value="implementation" className="space-y-6">
            <ImplementationGuide />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <AudioTesting />
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-6">
            <BenchmarkResults />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
