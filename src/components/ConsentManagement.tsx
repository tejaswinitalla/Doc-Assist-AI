
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Check, 
  X, 
  Clock, 
  Shield,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClinicalNote {
  id: string;
  title: string;
  date: Date;
  type: 'consultation' | 'procedure' | 'lab_results' | 'discharge_summary';
  provider: string;
  summary: string;
}

interface ConsentRecord {
  noteId: string;
  status: 'granted' | 'revoked' | 'pending';
  timestamp: Date;
  webhookStatus: 'pending' | 'sent' | 'failed';
}

interface ConsentHistory {
  id: string;
  noteId: string;
  action: 'grant' | 'revoke';
  timestamp: Date;
  reason?: string;
}

const ConsentManagement: React.FC = () => {
  const [clinicalNotes] = useState<ClinicalNote[]>([
    {
      id: 'note-001',
      title: 'Annual Physical Examination',
      date: new Date('2024-06-15'),
      type: 'consultation',
      provider: 'Dr. Sarah Johnson',
      summary: 'Routine physical exam with blood pressure, weight, and general health assessment.'
    },
    {
      id: 'note-002',
      title: 'Blood Work Results',
      date: new Date('2024-06-20'),
      type: 'lab_results',
      provider: 'Memorial Lab Services',
      summary: 'Complete blood count, lipid panel, and glucose levels within normal ranges.'
    },
    {
      id: 'note-003',
      title: 'Cardiology Consultation',
      date: new Date('2024-07-01'),
      type: 'consultation',
      provider: 'Dr. Michael Chen',
      summary: 'Follow-up for hypertension management and medication adjustment.'
    }
  ]);

  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [consentHistory, setConsentHistory] = useState<ConsentHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
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

  const simulateWebhook = async (noteId: string, action: 'grant' | 'revoke'): Promise<boolean> => {
    try {
      // Simulate API call to blockchain/webhook endpoint
      const response = await new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
          // 90% success rate for demo
          resolve({ success: Math.random() > 0.1 });
        }, 1500);
      });

      if (response.success) {
        console.log(`Webhook sent successfully for ${action} action on note ${noteId}`);
        return true;
      } else {
        throw new Error('Webhook failed');
      }
    } catch (error) {
      console.error('Webhook simulation failed:', error);
      return false;
    }
  };

  const handleConsentAction = async (noteId: string, action: 'grant' | 'revoke') => {
    setIsProcessing(noteId);

    try {
      // Update consent record
      const newStatus = action === 'grant' ? 'granted' : 'revoked';
      
      setConsentRecords(prev => 
        prev.map(record => 
          record.noteId === noteId 
            ? { ...record, status: newStatus, timestamp: new Date(), webhookStatus: 'pending' }
            : record
        )
      );

      // Add to history
      const historyEntry: ConsentHistory = {
        id: `history-${Date.now()}`,
        noteId,
        action,
        timestamp: new Date()
      };
      setConsentHistory(prev => [historyEntry, ...prev]);

      // Simulate webhook call
      const webhookSuccess = await simulateWebhook(noteId, action);
      
      // Update webhook status
      setConsentRecords(prev => 
        prev.map(record => 
          record.noteId === noteId 
            ? { ...record, webhookStatus: webhookSuccess ? 'sent' : 'failed' }
            : record
        )
      );

      if (webhookSuccess) {
        toast({
          title: `Access ${action === 'grant' ? 'Granted' : 'Revoked'}`,
          description: `Successfully ${action === 'grant' ? 'granted' : 'revoked'} access to clinical note. Blockchain record updated.`,
        });
      } else {
        toast({
          title: "Webhook Failed",
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
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Data Access Consent Management</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50 mb-6">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Patient Control:</strong> You have full control over who can access your clinical notes. 
              Each action is recorded on a secure blockchain for transparency and immutability.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Clinical Notes</h3>
            
            <ScrollArea className="h-96 w-full">
              <div className="space-y-4">
                {clinicalNotes.map((note) => {
                  const consentStatus = getConsentStatus(note.id);
                  const isProcessingThis = isProcessing === note.id;
                  
                  return (
                    <Card key={note.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              {getNoteTypeIcon(note.type)}
                              <div>
                                <h4 className="font-medium text-gray-900">{note.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {note.provider} • {note.date.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-700">{note.summary}</p>
                            
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
                              </Badge>
                              
                              {consentStatus?.webhookStatus === 'failed' && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Sync Failed
                                </Badge>
                              )}
                              
                              {consentStatus?.webhookStatus === 'sent' && (
                                <Badge variant="outline" className="text-xs">
                                  <Check className="w-3 h-3 mr-1" />
                                  Blockchain Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              onClick={() => handleConsentAction(note.id, 'grant')}
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Consent History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span>Consent History</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-48 w-full">
            <div className="space-y-2">
              {consentHistory.map((entry) => {
                const note = clinicalNotes.find(n => n.id === entry.noteId);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      {entry.action === 'grant' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        {entry.action === 'grant' ? 'Granted' : 'Revoked'} access to "{note?.title}"
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleString()}
                    </span>
                  </div>
                );
              })}
              
              {consentHistory.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No consent actions recorded yet
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentManagement;
