
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wallet, Share, Shield, UserX, Clock, FileText } from 'lucide-react';
import { patientPortalService } from '../services/patientPortalService';
import { toast } from '@/hooks/use-toast';

interface DataNFT {
  tokenID: string;
  timestamp: string;
  clinicianName: string;
  tags: string[];
  isShared: boolean;
  sharedWith: string[];
  recordType: string;
}

interface WalletDashboardProps {
  connectedWallet: string | null;
}

const WalletDashboard = ({ connectedWallet }: WalletDashboardProps) => {
  const [dataNFTs, setDataNFTs] = useState<DataNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareAddress, setShareAddress] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);

  useEffect(() => {
    loadDataNFTs();
  }, []);

  const loadDataNFTs = async () => {
    try {
      const nfts = await patientPortalService.getDataNFTs();
      setDataNFTs(nfts);
    } catch (error) {
      console.error('Failed to load DataNFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (tokenID: string, providerAddress: string) => {
    try {
      await patientPortalService.grantAccess(tokenID, providerAddress);
      await loadDataNFTs(); // Refresh data
      
      toast({
        title: "Access Granted",
        description: `Successfully shared DataNFT ${tokenID} with provider`,
      });
      
      setShareAddress('');
      setSelectedNFT(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to grant access. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAccess = async (tokenID: string, providerAddress: string) => {
    try {
      await patientPortalService.revokeAccess(tokenID, providerAddress);
      await loadDataNFTs(); // Refresh data
      
      toast({
        title: "Access Revoked",
        description: `Successfully revoked access for DataNFT ${tokenID}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lab report':
        return <FileText className="w-4 h-4" />;
      case 'discharge summary':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lab report':
        return 'bg-blue-100 text-blue-700';
      case 'discharge summary':
        return 'bg-green-100 text-green-700';
      case 'prescription':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!connectedWallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription>
            Connect your Web3 wallet to view and manage your DataNFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => patientPortalService.connectWallet()}>
            <Wallet className="w-4 h-4 mr-2" />
            Connect MetaMask
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            My DataNFTs
          </CardTitle>
          <CardDescription>
            Manage access to your clinical records stored as DataNFTs
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {dataNFTs.map((nft) => (
          <Card key={nft.tokenID} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getRecordTypeIcon(nft.recordType)}
                    <CardTitle className="text-lg">Token #{nft.tokenID}</CardTitle>
                    <Badge className={getRecordTypeColor(nft.recordType)}>
                      {nft.recordType}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Created: {new Date(nft.timestamp).toLocaleDateString()}
                  </CardDescription>
                  <p className="text-sm text-slate-600">
                    Clinician: <span className="font-medium">{nft.clinicianName}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {nft.isShared ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Shield className="w-3 h-3 mr-1" />
                      Shared
                    </Badge>
                  ) : (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {nft.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Shared With List */}
                {nft.sharedWith.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Shared with:</p>
                    <div className="space-y-2">
                      {nft.sharedWith.map((address, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                          <span className="text-sm font-mono text-slate-600">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevokeAccess(nft.tokenID, address)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserX className="w-3 h-3 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                        <Share className="w-3 h-3 mr-1" />
                        Share with Provider
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="provider-address">Provider Wallet Address</Label>
                          <Input
                            id="provider-address"
                            placeholder="0x1234..."
                            value={shareAddress}
                            onChange={(e) => setShareAddress(e.target.value)}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleGrantAccess(nft.tokenID, shareAddress)}
                          disabled={!shareAddress}
                          className="w-full"
                        >
                          Grant Access
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WalletDashboard;
