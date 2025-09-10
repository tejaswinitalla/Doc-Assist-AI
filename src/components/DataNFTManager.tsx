import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wallet, Share2, Eye, Trash2, Search, Filter, 
  Calendar, Shield, ExternalLink, Copy, CheckCircle,
  Clock, Users, FileText, AlertTriangle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface DataNFT {
  tokenID: string;
  timestamp: string;
  clinicianName: string;
  tags: string[];
  isShared: boolean;
  sharedWith: string[];
  recordType: string;
  status: 'active' | 'revoked' | 'pending';
  earnings?: number;
  accessCount?: number;
  lastAccessed?: string;
  clinicalSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

interface DataNFTManagerProps {
  dataNFTs: DataNFT[];
  onGrantAccess: (tokenId: string, address: string) => Promise<void>;
  onRevokeAccess: (tokenId: string, address: string) => Promise<void>;
}

const DataNFTManager: React.FC<DataNFTManagerProps> = ({
  dataNFTs,
  onGrantAccess,
  onRevokeAccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNFT, setSelectedNFT] = useState<DataNFT | null>(null);
  const [filteredNFTs, setFilteredNFTs] = useState<DataNFT[]>(dataNFTs);

  useEffect(() => {
    let filtered = dataNFTs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft.tokenID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.clinicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(nft => nft.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(nft => nft.recordType === typeFilter);
    }

    setFilteredNFTs(filtered);
  }, [searchTerm, statusFilter, typeFilter, dataNFTs]);

  const handleCopyTokenId = (tokenId: string) => {
    navigator.clipboard.writeText(tokenId);
    toast({
      title: "Token ID copied",
      description: "Token ID has been copied to clipboard",
    });
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-medical-error text-white';
      case 'high': return 'bg-medical-warning text-white';
      case 'medium': return 'bg-medical-teal text-white';
      case 'low': return 'bg-medical-success text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-medical-success" />;
      case 'pending': return <Clock className="w-4 h-4 text-medical-warning" />;
      case 'revoked': return <AlertTriangle className="w-4 h-4 text-medical-error" />;
      default: return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="medical-card p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <Wallet className="w-6 h-6 mr-3 text-primary" />
              DataNFT Portfolio
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your tokenized health data assets
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{dataNFTs.length}</p>
              <p className="text-sm text-muted-foreground">Total NFTs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-medical-success">
                {dataNFTs.filter(nft => nft.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-medical-teal">
                ${dataNFTs.reduce((sum, nft) => sum + (nft.earnings || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Earnings</p>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search NFTs, doctors, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Lab Report">Lab Reports</SelectItem>
              <SelectItem value="Discharge Summary">Discharge Summaries</SelectItem>
              <SelectItem value="Clinical Notes">Clinical Notes</SelectItem>
              <SelectItem value="Imaging">Medical Imaging</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* DataNFT Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredNFTs.map((nft, index) => (
          <Card 
            key={nft.tokenID} 
            className="medical-card hover:shadow-lg transition-all duration-300 animate-slide-up"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(nft.status)}
                  <CardTitle className="text-lg">Token #{nft.tokenID}</CardTitle>
                </div>
                <Badge 
                  variant="secondary" 
                  className={nft.clinicalSeverity ? getSeverityColor(nft.clinicalSeverity) : 'bg-muted'}
                >
                  {nft.clinicalSeverity?.toUpperCase() || 'STANDARD'}
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(nft.timestamp).toLocaleDateString()}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground">{nft.recordType}</h4>
                <p className="text-sm text-muted-foreground">Dr. {nft.clinicianName}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {nft.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {nft.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{nft.tags.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Access Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{nft.sharedWith.length} shared</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{nft.accessCount || 0} views</span>
                </div>
              </div>

              {/* Earnings */}
              {nft.earnings && nft.earnings > 0 && (
                <div className="text-sm font-medium text-medical-success">
                  Earned: ${nft.earnings.toFixed(2)}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-primary" />
                        DataNFT Details - Token #{selectedNFT?.tokenID}
                      </DialogTitle>
                    </DialogHeader>
                    {selectedNFT && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">Basic Information</h4>
                            <div className="space-y-2 text-sm">
                              <div><strong>Record Type:</strong> {selectedNFT.recordType}</div>
                              <div><strong>Clinician:</strong> Dr. {selectedNFT.clinicianName}</div>
                              <div><strong>Date Created:</strong> {new Date(selectedNFT.timestamp).toLocaleString()}</div>
                              <div><strong>Status:</strong> 
                                <Badge className="ml-2" variant={selectedNFT.status === 'active' ? 'default' : 'secondary'}>
                                  {selectedNFT.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Access & Sharing</h4>
                            <div className="space-y-2 text-sm">
                              <div><strong>Shared With:</strong> {selectedNFT.sharedWith.length} providers</div>
                              <div><strong>Total Views:</strong> {selectedNFT.accessCount || 0}</div>
                              <div><strong>Last Accessed:</strong> {selectedNFT.lastAccessed || 'Never'}</div>
                              <div><strong>Total Earnings:</strong> ${selectedNFT.earnings?.toFixed(2) || '0.00'}</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Clinical Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedNFT.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Shared Addresses</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedNFT.sharedWith.length > 0 ? (
                              selectedNFT.sharedWith.map((address, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                                  <span className="font-mono">{address.slice(0, 10)}...{address.slice(-8)}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleCopyTokenId(address)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground text-sm">Not shared with any providers</p>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button className="flex-1">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Access
                          </Button>
                          <Button variant="outline">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Blockchain
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCopyTokenId(nft.tokenID)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNFTs.length === 0 && (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No DataNFTs found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? "Try adjusting your filters to see more results." 
              : "Your DataNFTs will appear here once created."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default DataNFTManager;