
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Key, Shield, Wallet, FileText, Lock } from 'lucide-react';
import { patientPortalService } from '../services/patientPortalService';
import { toast } from '@/hooks/use-toast';

interface ExportToolsProps {
  connectedWallet: string | null;
}

const ExportTools = ({ connectedWallet }: ExportToolsProps) => {
  const [exportPassword, setExportPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);

  const handleDownloadWalletKey = async () => {
    if (!exportPassword || exportPassword !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "Please enter matching passwords",
        variant: "destructive",
      });
      return;
    }

    if (exportPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      await patientPortalService.exportWalletKey(exportPassword);
      
      toast({
        title: "Export Successful",
        description: "Wallet key has been downloaded as an encrypted ZIP file",
      });
      
      setExportPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export wallet key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleConnectWeb3Wallet = async () => {
    try {
      const wallet = await patientPortalService.connectWallet();
      setWalletInfo(wallet);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your Web3 wallet",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Web3 wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportDataNFTs = async () => {
    try {
      await patientPortalService.exportDataNFTs();
      
      toast({
        title: "Export Successful",
        description: "DataNFT metadata has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export DataNFT data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Key Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Download Wallet Key
          </CardTitle>
          <CardDescription>
            Export your private key as an encrypted ZIP file for backup purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Your private key will be encrypted with your password before download. 
              Keep this file secure and never share your password.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="export-password">Export Password</Label>
              <Input
                id="export-password"
                type="password"
                placeholder="Enter a strong password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          <Button
            onClick={handleDownloadWalletKey}
            disabled={!exportPassword || exportPassword !== confirmPassword || isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Lock className="w-4 h-4 mr-2 animate-spin" />
                Encrypting and Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Encrypted Wallet Key
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Web3 Wallet Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Web3 Wallet Integration
          </CardTitle>
          <CardDescription>
            Connect your MetaMask or compatible Web3 wallet for read-only access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedWallet ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-700">
                    <Shield className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <span className="text-sm text-green-700">
                    Wallet Address:
                  </span>
                </div>
                <span className="font-mono text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                  {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-700">NFT Balance</div>
                  <div className="text-lg font-bold text-blue-600">12</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-700">Active Shares</div>
                  <div className="text-lg font-bold text-green-600">7</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-700">Network</div>
                  <div className="text-lg font-bold text-purple-600">Ethereum</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-slate-600">No wallet connected</p>
              <Button onClick={handleConnectWeb3Wallet}>
                <Wallet className="w-4 h-4 mr-2" />
                Connect MetaMask
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Data Export
          </CardTitle>
          <CardDescription>
            Download your DataNFT metadata and transaction history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={handleExportDataNFTs}
              className="h-20 flex-col space-y-2"
            >
              <FileText className="w-6 h-6" />
              <span>Export DataNFT Metadata</span>
              <span className="text-xs text-slate-500">JSON format</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => patientPortalService.exportConsentHistory()}
              className="h-20 flex-col space-y-2"
            >
              <Download className="w-6 h-6" />
              <span>Export Consent History</span>
              <span className="text-xs text-slate-500">CSV format</span>
            </Button>
          </div>
          
          <Alert>
            <FileText className="w-4 h-4" />
            <AlertDescription>
              Exported files contain metadata only. Actual medical records remain 
              secure and are only accessible through authorized channels.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportTools;
