
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Shield, Download, Bell, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import WalletDashboard from '../components/WalletDashboard';
import ConsentLogViewer from '../components/ConsentLogViewer';
import ExportTools from '../components/ExportTools';
import NotificationPanel from '../components/NotificationPanel';
import { patientPortalService } from '../services/patientPortalService';

const PatientPortal = () => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [notifications, setNotifications] = useState([]);
  const [connectedWallet, setConnectedWallet] = useState(null);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      const notifs = await patientPortalService.getNotifications();
      setNotifications(notifs);
      
      // Check for connected wallet
      const wallet = await patientPortalService.checkWalletConnection();
      setConnectedWallet(wallet);
    };

    loadData();
  }, []);

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Clinical Voice Insights
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Patient Portal</h1>
                  <p className="text-sm text-slate-600">Manage your DataNFTs and consent settings</p>
                </div>
              </div>
              {connectedWallet && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Wallet className="w-5 h-5 mr-2 text-blue-500" />
                My DataNFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">12</p>
              <p className="text-sm text-slate-500">Active tokens</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 mr-2 text-green-500" />
                Active Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">7</p>
              <p className="text-sm text-slate-500">Providers with access</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Bell className="w-5 h-5 mr-2 text-orange-500" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{notifications.length}</p>
              <p className="text-sm text-slate-500">Pending alerts</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Download className="w-5 h-5 mr-2 text-purple-500" />
                Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">3</p>
              <p className="text-sm text-slate-500">Recent downloads</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="wallet" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Wallet Dashboard
            </TabsTrigger>
            <TabsTrigger value="consent" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Consent Log
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Export Tools
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6">
            <WalletDashboard connectedWallet={connectedWallet} />
          </TabsContent>

          <TabsContent value="consent" className="space-y-6">
            <ConsentLogViewer />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportTools connectedWallet={connectedWallet} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
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
