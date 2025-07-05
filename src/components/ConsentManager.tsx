
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Check, 
  X, 
  Clock, 
  Shield,
  AlertTriangle,
  ExternalLink,
  User,
  Eye,
  EyeOff,
  Download,
  Link2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClinicalNote {
  id: string;
  title: string;
  date: Date;
  type: 'consultation' | 'procedure' | 'lab_results' | 'discharge_summary';
  provider: string;
  summary: string;
  fullContent: string;
  sensitiveFields: {
    diagnosisCodes: string[];
    clinicianComments: string;
    privateNotes: string;
  };
  ehrId: string;
}

interface ConsentRecord {
  noteId: string;
  status: 'granted' | 'revoked' | 'pending';
  timestamp: Date;
  webhookStatus: 'pending' | 'sent' | 'failed';
  recipientEhrId?: string;
  blockchainTxId?: string;
}

interface ConsentAuditEntry {
  id: string;
  noteId: string;
  action: 'grant' | 'revoke' | 'view';
  timestamp: Date;
  recipientEhrId: string;
  patientId: string;
  blockchainTxId?: string;
  reason?: string;
}

interface BlockchainResponse {
  success: boolean;
  transactionId: string;
  blockNumber?: number;
  gasUsed?: number;
}

const ConsentManager: React.FC = () => {
  const [clinicalNotes] = useState<ClinicalNote[]>([
    {
      id: 'note-001',
      title: 'Annual Physical Examination',
      date: new Date('2024-06-15'),
      type: 'consultation',
      provider: 'Dr. Sarah Johnson',
      summary: 'Routine physical exam with blood pressure, weight, and general health assessment.',
      fullContent: 'Patient presents for annual physical examination. Vital signs: BP 120/80, HR 72, RR 16, Temp 98.6°F. Physical exam reveals normal heart sounds, clear lungs, no abdominal tenderness.',
      sensitiveFields: {
        diagnosisCodes: ['Z00.00', 'Z87.891'],
        clinicianComments: 'Patient appears anxious about recent family history of heart disease.',
        privateNotes: 'Discussed lifestyle modifications and stress management techniques.'
      },
      ehrId: 'EHR-001'
    },
    {
      id: 'note-002',
      title: 'Cardiology Consultation',
      date: new Date('2024-07-01'),
      type: 'consultation',
      provider: 'Dr. Michael Chen',
      summary: 'Follow-up for hypertension management and medication adjustment.',
      fullContent: 'Patient returns for hypertension follow-up. Current medications: Lisinopril 10mg daily. BP today 135/85. EKG shows normal sinus rhythm.',
      sensitiveFields: {
        diagnosisCodes: ['I10', 'Z79.4'],
        clinicianComments: 'Patient reports occasional dizziness with current medication.',
        privateNotes: 'Consider switching to ARB if ACE inhibitor side effects persist.'
      },
      ehrId: 'EHR-002'
    },
    {
      id: 'note-003',
      title: 'Lab Results - Comprehensive Panel',
      date: new Date('2024-07-10'),
      type: 'lab_results',
      provider: 'Memorial Lab Services',
      summary: 'Complete blood count, lipid panel, and glucose levels within normal ranges.',
      fullContent: 'CBC: WBC 6.2, RBC 4.5, Hgb 14.2, Hct 42.1. Lipids: Total chol 185, LDL 110, HDL 48, Trig 135. Glucose 95.',
      sensitiveFields: {
        diagnosisCodes: ['Z00.00'],
        clinicianComments: 'HDL slightly low, recommend increased exercise.',
        privateNotes: 'Patient concerned about cholesterol due to family history.'
      },
      ehrId: 'EHR-003'
    }
  ]);

  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [auditLog, setAuditLog] = useState<ConsentAuditEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  
  const { toast } = useToast();

  // Initialize consent records
  useEffect(() => {
    const initialRecords = clinicalNotes.map(note => ({
      noteId: note.id,
      status: 'pending' as const,
      timestamp: new Date(),
      webhookStatus: 'pending' as const
    }));
    setConsentRecords(initialRecords);
  }, [clinicalNotes]);

  const simulateBlockchainWebhook = async (
    noteId: string, 
    action: 'grant' | 'revoke',
    recipientEhrId: string
  ): Promise<BlockchainResponse> => {
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        const response: BlockchainResponse = {
          success: true,
          transactionId: `0x${Math.random().toString(16).substring(2, 42)}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
          gasUsed: Math.floor(Math.random() * 50000) + 21000
        };
        
        console.log(`Blockchain transaction successful:`, response);
        return response;
      } else {
        throw new Error('Blockchain transaction failed');
      }
    } catch (error) {
      console.error('Blockchain webhook failed:', error);
      return { success: false, transactionId: '' };
    }
  };

  const handleConsentAction = async (
    noteId: string, 
    action: 'grant' | 'revoke',
    recipientEhrId?: string
  ) => {
    if (action === 'grant' && !recipientEhrId) {
      toast({
        title: "Recipient Required",
        description: "Please specify the recipient's EHR ID for access grant.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(noteId);

    try {
      const ehrId = recipientEhrId || selectedRecipient || 'UNKNOWN';
      
      // Update consent record
      const newStatus = action === 'grant' ? 'granted' : 'revoked';
      
      setConsentRecords(prev => 
        prev.map(record => 
          record.noteId === noteId 
            ? { 
                ...record, 
                status: newStatus, 
                timestamp: new Date(), 
                webhookStatus: 'pending',
                recipientEhrId: ehrId
              }
            : record
        )
      );

      // Simulate blockchain transaction
      const blockchainResponse = await simulateBlockchainWebhook(noteId, action, ehrId);
      
      // Update webhook status and blockchain info
      setConsentRecords(prev => 
        prev.map(record => 
          record.noteId === noteId 
            ? { 
                ...record, 
                webhookStatus: blockchainResponse.success ? 'sent' : 'failed',
                blockchainTxId: blockchainResponse.transactionId
              }
            : record
        )
      );

      // Add to audit log
      const auditEntry: ConsentAuditEntry = {
        id: `audit-${Date.now()}`,
        noteId,
        action,
        timestamp: new Date(),
        recipientEhrId: ehrId,
        patientId: 'PATIENT-001',
        blockchainTxId: blockchainResponse.success ? blockchainResponse.transactionId : undefined
      };
      setAuditLog(prev => [auditEntry, ...prev]);

      if (blockchainResponse.success) {
        toast({
          title: `Access ${action === 'grant' ? 'Granted' : 'Revoked'}`,
          description: `Successfully ${action === 'grant' ? 'granted' : 'revoked'} access. Blockchain TX: ${blockchainResponse.transactionId.substring(0, 10)}...`,
        });
      } else {
        toast({
          title: "Blockchain Logging Failed",
          description: "Access status updated locally, but blockchain logging failed. Please retry.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Consent action failed:', error);
      toast({
        title: "Action Failed",
        description: "Could not process consent action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleSensitiveData = (noteId: string) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));

    // Log view action in audit
    const auditEntry: ConsentAuditEntry = {
      id: `audit-${Date.now()}`,
      noteId,
      action: 'view',
      timestamp: new Date(),
      recipientEhrId: 'PATIENT-001',
      patientId: 'PATIENT-001'
    };
    setAuditLog(prev => [auditEntry, ...prev]);
  };

  const exportAuditLog = () => {
    const data = {
      exportTime: new Date().toISOString(),
      patientId: 'PATIENT-001',
      auditEntries: auditLog,
      consentRecords: consentRecords
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Audit Log Exported",
      description: "Consent audit log downloaded successfully",
    });
  };

  const getConsentStatus = (noteId: string) => {
    return consentRecords.find(record => record.noteId === noteId);
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'lab_results':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'procedure':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'discharge_summary':
        return <FileText className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span>Patient Consent Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={exportAuditLog} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export Audit Log
              </Button>
              <Badge variant="outline">
                <Link2 className="w-3 h-3 mr-1" />
                Blockchain Enabled
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50 mb-6">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Patient Control:</strong> You have full control over who can access your clinical notes. 
              Each action is immutably recorded on blockchain with smart contract verification.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="notes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">
                Clinical Notes ({clinicalNotes.length})
              </TabsTrigger>
              <TabsTrigger value="audit">
                Audit Log ({auditLog.length})
              </TabsTrigger>
              <TabsTrigger value="recipients">
                Manage Recipients
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <div className="space-y-4">
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-4">
                    {clinicalNotes.map((note) => {
                      const consentStatus = getConsentStatus(note.id);
                      const isProcessingThis = isProcessing === note.id;
                      const showSensitive = showSensitiveData[note.id];
                      
                      return (
                        <Card key={note.id} className="border shadow-sm">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center space-x-3">
                                    {getNoteTypeIcon(note.type)}
                                    <div>
                                      <h4 className="font-medium text-gray-900">{note.title}</h4>
                                      <p className="text-sm text-gray-500">
                                        {note.provider} • {note.date.toLocaleDateString()} • EHR: {note.ehrId}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <p className="text-sm text-gray-700"><strong>Summary:</strong> {note.summary}</p>
                                    <p className="text-sm text-gray-700"><strong>Content:</strong> {note.fullContent}</p>
                                  </div>
                                  
                                  {/* Sensitive Fields Toggle */}
                                  <div className="border-t pt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSensitiveData(note.id)}
                                      className="mb-2"
                                    >
                                      {showSensitive ? (
                                        <>
                                          <EyeOff className="w-4 h-4 mr-1" />
                                          Hide Sensitive Data
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-4 h-4 mr-1" />
                                          Show Sensitive Data
                                        </>
                                      )}
                                    </Button>
                                    
                                    {showSensitive && (
                                      <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                                        <p><strong>Diagnosis Codes:</strong> {note.sensitiveFields.diagnosisCodes.join(', ')}</p>
                                        <p><strong>Clinician Comments:</strong> {note.sensitiveFields.clinicianComments}</p>
                                        <p><strong>Private Notes:</strong> {note.sensitiveFields.privateNotes}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <Badge 
                                      variant={
                                        consentStatus?.status === 'granted' 
                                          ? 'default' 
                                          : consentStatus?.status === 'revoked' 
                                          ? 'destructive' 
                                          : 'secondary'
                                      }
                                    >
                                      {consentStatus?.status || 'pending'}
                                      {consentStatus?.recipientEhrId && ` → ${consentStatus.recipientEhrId}`}
                                    </Badge>
                                    
                                    {consentStatus?.webhookStatus === 'failed' && (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Blockchain Failed
                                      </Badge>
                                    )}
                                    
                                    {consentStatus?.blockchainTxId && (
                                      <Badge variant="outline" className="text-xs">
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        TX: {consentStatus.blockchainTxId.substring(0, 8)}...
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col space-y-2 ml-4">
                                  <input
                                    type="text"
                                    placeholder="Recipient EHR ID"
                                    value={selectedRecipient}
                                    onChange={(e) => setSelectedRecipient(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded"
                                  />
                                  
                                  <Button
                                    onClick={() => handleConsentAction(note.id, 'grant', selectedRecipient)}
                                    disabled={isProcessingThis || consentStatus?.status === 'granted'}
                                    size="sm"
                                    className="w-full"
                                  >
                                    {isProcessingThis ? (
                                      <>Processing...</>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Grant Access
                                      </>
                                    )}
                                  </Button>
                                  
                                  <Button
                                    onClick={() => handleConsentAction(note.id, 'revoke')}
                                    disabled={isProcessingThis || consentStatus?.status === 'revoked'}
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                  >
                                    {isProcessingThis ? (
                                      <>Processing...</>
                                    ) : (
                                      <>
                                        <X className="w-4 h-4 mr-1" />
                                        Revoke Access
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <span>Blockchain Audit Trail</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <ScrollArea className="h-64 w-full">
                    <div className="space-y-2">
                      {auditLog.map((entry) => {
                        const note = clinicalNotes.find(n => n.id === entry.noteId);
                        return (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              {entry.action === 'grant' ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : entry.action === 'revoke' ? (
                                <X className="w-4 h-4 text-red-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-blue-600" />
                              )}
                              <div className="text-sm">
                                <div className="font-medium">
                                  {entry.action === 'grant' ? 'Granted' : entry.action === 'revoke' ? 'Revoked' : 'Viewed'} 
                                  access to "{note?.title}"
                                </div>
                                <div className="text-gray-500">
                                  Recipient: {entry.recipientEhrId}
                                  {entry.blockchainTxId && (
                                    <span className="ml-2">• TX: {entry.blockchainTxId.substring(0, 10)}...</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {entry.timestamp.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                      
                      {auditLog.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No audit entries recorded yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Access Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Configure trusted healthcare providers and their EHR system IDs for secure data sharing.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-sm text-gray-600">
                      <p>Common EHR System ID formats:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Epic: EMP-[Provider-ID]</li>
                        <li>Cerner: CER-[Facility-Code]-[Provider-ID]</li>
                        <li>Allscripts: ALS-[Practice-ID]-[Provider-ID]</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentManager;
