
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Wallet, Shield, Download, Bell, ArrowLeft, TrendingUp, Clock, Users, FileText, CheckCircle, AlertCircle, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import WalletDashboard from '../components/WalletDashboard';
import ConsentLogViewer from '../components/ConsentLogViewer';
import ExportTools from '../components/ExportTools';
import NotificationPanel from '../components/NotificationPanel';
import DataNFTManager from '../components/DataNFTManager';
import ConsentTimeline from '../components/ConsentTimeline';
import VoiceUIAnimations from '../components/VoiceUIAnimations';
import PostVisitFollowUp from '../components/PostVisitFollowUp';
import { patientPortalService } from '../services/patientPortalService';
import { voiceInteractionService } from '../services/voiceInteractionService';

const PatientPortal = () => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [notifications, setNotifications] = useState([]);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [dataNFTs, setDataNFTs] = useState([]);
  const [consentActivity, setConsentActivity] = useState([]);
  const [consentEvents, setConsentEvents] = useState([]);
  const [followUpTasks, setFollowUpTasks] = useState([]);
  const [voiceState, setVoiceState] = useState({
    status: 'idle' as const,
    isRecording: false,
    volume: 0,
    transcript: '',
    alerts: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [notifs, wallet, nfts, activity, events, tasks] = await Promise.all([
          patientPortalService.getNotifications(),
          patientPortalService.checkWalletConnection(),
          patientPortalService.getDataNFTs(),
          patientPortalService.getConsentActivity(),
          patientPortalService.getConsentEvents(),
          patientPortalService.getFollowUpTasks()
        ]);
        
        setNotifications(notifs);
        setConnectedWallet(wallet);
        setDataNFTs(nfts);
        setConsentActivity(activity);
        setConsentEvents(events);
        setFollowUpTasks(tasks);
      } catch (error) {
        console.error('Failed to load patient portal data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleGrantAccess = async (tokenId: string, address: string) => {
    await patientPortalService.grantAccess(tokenId, address);
    // Reload data
    const nfts = await patientPortalService.getDataNFTs();
    setDataNFTs(nfts);
  };

  const handleRevokeAccess = async (tokenId: string, address: string) => {
    await patientPortalService.revokeAccess(tokenId, address);
    // Reload data
    const nfts = await patientPortalService.getDataNFTs();
    setDataNFTs(nfts);
  };

  const handleToggleVoiceRecording = () => {
    if (voiceState.isRecording) {
      voiceInteractionService.stopListening();
    } else {
      voiceInteractionService.startListening();
    }
  };

  const handleDismissVoiceAlert = (alertId: string) => {
    setVoiceState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  };

  const handleSendFollowUp = async (taskId: string) => {
    // Simulate sending follow-up
    console.log('Sending follow-up for task:', taskId);
  };

  const handleMarkFollowUpCompleted = async (taskId: string) => {
    // Simulate marking completed
    console.log('Marking follow-up completed:', taskId);
  };

  const handleScheduleFollowUpReminder = async (taskId: string, reminderDate: string) => {
    // Simulate scheduling reminder
    console.log('Scheduling reminder:', taskId, reminderDate);
  };

  const activeDataNFTs = dataNFTs.filter(nft => nft.status === 'active').length;
  const pendingConsents = consentActivity.filter(activity => activity.status === 'pending').length;
  const totalEarnings = dataNFTs.reduce((sum, nft) => sum + (nft.earnings || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your patient portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Clinical Voice Insights
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 medical-gradient rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Patient Portal</h1>
                  <p className="text-sm text-muted-foreground">Manage your DataNFTs and consent settings</p>
                </div>
              </div>
              {connectedWallet && (
                <Badge variant="secondary" className="bg-medical-success/10 text-medical-success border-medical-success/20">
                  <Shield className="w-3 h-3 mr-1" />
                  Wallet Connected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <NotificationPanel 
          notifications={notifications} 
          onDismiss={handleDismissNotification}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="medical-card border-l-4 border-l-primary hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Wallet className="w-5 h-5 mr-2 text-primary" />
                My DataNFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary">{activeDataNFTs}</p>
                <p className="text-sm text-muted-foreground">Active tokens</p>
                <div className="flex items-center text-xs text-medical-success">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2 this month
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card border-l-4 border-l-medical-success hover:shadow-lg transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 mr-2 text-medical-success" />
                Consent Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-medical-success">{consentActivity.filter(a => a.status === 'granted').length}</p>
                <p className="text-sm text-muted-foreground">Active consents</p>
                <div className="flex items-center text-xs text-medical-warning">
                  <Clock className="w-3 h-3 mr-1" />
                  {pendingConsents} pending
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card border-l-4 border-l-medical-warning hover:shadow-lg transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Bell className="w-5 h-5 mr-2 text-medical-warning" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-medical-warning">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Pending alerts</p>
                <div className="flex items-center text-xs text-medical-error">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {notifications.filter(n => n.priority === 'high').length} high priority
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card border-l-4 border-l-medical-teal hover:shadow-lg transition-all duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-medical-teal" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-medical-teal">${totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total earned</p>
                <div className="flex items-center text-xs text-medical-success">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +${(totalEarnings * 0.12).toFixed(2)} this month
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="medical-card hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('wallet')}>
            <CardContent className="flex items-center p-4">
              <div className="w-12 h-12 medical-gradient rounded-full flex items-center justify-center mr-4">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Manage DataNFTs</h3>
                <p className="text-sm text-muted-foreground">View and manage your health data tokens</p>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('consent')}>
            <CardContent className="flex items-center p-4">
              <div className="w-12 h-12 bg-medical-success rounded-full flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Review Consents</h3>
                <p className="text-sm text-muted-foreground">Track and manage data sharing permissions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('export')}>
            <CardContent className="flex items-center p-4">
              <div className="w-12 h-12 bg-medical-teal rounded-full flex items-center justify-center mr-4">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Export Data</h3>
                <p className="text-sm text-muted-foreground">Download your health records</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-card/80 backdrop-blur-sm border border-border">
            <TabsTrigger value="wallet" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Wallet className="w-4 h-4 mr-2" />
              NFT Manager
            </TabsTrigger>
            <TabsTrigger value="consent" className="data-[state=active]:bg-medical-success data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Consent Timeline
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Mic className="w-4 h-4 mr-2" />
              Voice UI
            </TabsTrigger>
            <TabsTrigger value="followup" className="data-[state=active]:bg-medical-teal data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Follow-Up
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-medical-teal data-[state=active]:text-white">
              <Download className="w-4 h-4 mr-2" />
              Export Tools
            </TabsTrigger>
            <TabsTrigger value="legacy" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <Wallet className="w-4 h-4 mr-2" />
              Legacy Wallet
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-medical-warning data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6 animate-slide-up">
            <DataNFTManager 
              dataNFTs={dataNFTs}
              onGrantAccess={handleGrantAccess}
              onRevokeAccess={handleRevokeAccess}
            />
          </TabsContent>

          <TabsContent value="consent" className="space-y-6 animate-slide-up">
            <ConsentTimeline consentEvents={consentEvents} />
          </TabsContent>

          <TabsContent value="voice" className="space-y-6 animate-slide-up">
            <VoiceUIAnimations 
              voiceState={voiceState}
              onToggleRecording={handleToggleVoiceRecording}
              onDismissAlert={handleDismissVoiceAlert}
            />
          </TabsContent>

          <TabsContent value="followup" className="space-y-6 animate-slide-up">
            <PostVisitFollowUp 
              followUpTasks={followUpTasks}
              onSendFollowUp={handleSendFollowUp}
              onMarkCompleted={handleMarkFollowUpCompleted}
              onScheduleReminder={handleScheduleFollowUpReminder}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-6 animate-slide-up">
            <ExportTools connectedWallet={connectedWallet} />
          </TabsContent>

          <TabsContent value="legacy" className="space-y-6 animate-slide-up">
            <WalletDashboard connectedWallet={connectedWallet} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 animate-slide-up">
            <NotificationPanel 
              notifications={notifications} 
              onDismiss={handleDismissNotification}
              fullView={true}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientPortal;
