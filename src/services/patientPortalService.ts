
// Mock service for Patient Portal functionality
// In a real application, this would integrate with actual Web3 APIs and blockchain

interface DataNFT {
  tokenID: string;
  timestamp: string;
  clinicianName: string;
  tags: string[];
  isShared: boolean;
  sharedWith: string[];
  recordType: string;
}

interface ConsentEvent {
  id: string;
  type: 'grant' | 'revoke' | 'view' | 'export';
  timestamp: string;
  providerName: string;
  providerAddress: string;
  tokenID: string;
  recordType: string;
  description: string;
}

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  persistent: boolean;
  actionRequired: boolean;
  relatedTokenID?: string;
}

class PatientPortalService {
  private mockDataNFTs: DataNFT[] = [
    {
      tokenID: "NFT001",
      timestamp: "2024-01-15T10:30:00Z",
      clinicianName: "Dr. Sarah Johnson",
      tags: ["Cardiology", "Routine Checkup", "Blood Pressure"],
      isShared: true,
      sharedWith: ["0x1234567890abcdef1234567890abcdef12345678"],
      recordType: "Lab Report"
    },
    {
      tokenID: "NFT002",
      timestamp: "2024-01-10T14:15:00Z",
      clinicianName: "Dr. Michael Chen",
      tags: ["Emergency", "Trauma", "X-Ray"],
      isShared: false,
      sharedWith: [],
      recordType: "Discharge Summary"
    },
    {
      tokenID: "NFT003",
      timestamp: "2024-01-08T09:00:00Z",
      clinicianName: "Dr. Emily Rodriguez",
      tags: ["Dermatology", "Skin Condition", "Biopsy"],
      isShared: true,
      sharedWith: ["0x9876543210fedcba9876543210fedcba98765432", "0x1111222233334444555566667777888899990000"],
      recordType: "Lab Report"
    }
  ];

  private mockConsentEvents: ConsentEvent[] = [
    {
      id: "CE001",
      type: "grant",
      timestamp: "2024-01-16T11:00:00Z",
      providerName: "City General Hospital",
      providerAddress: "0x1234567890abcdef1234567890abcdef12345678",
      tokenID: "NFT001",
      recordType: "Lab Report",
      description: "Granted access to Dr. Sarah Johnson for cardiology consultation"
    },
    {
      id: "CE002",
      type: "view",
      timestamp: "2024-01-16T09:30:00Z",
      providerName: "City General Hospital",
      providerAddress: "0x1234567890abcdef1234567890abcdef12345678",
      tokenID: "NFT001",
      recordType: "Lab Report",
      description: "Dr. Sarah Johnson viewed your lab report"
    },
    {
      id: "CE003",
      type: "revoke",
      timestamp: "2024-01-15T16:45:00Z",
      providerName: "Metro Health Clinic",
      providerAddress: "0x9876543210fedcba9876543210fedcba98765432",
      tokenID: "NFT003",
      recordType: "Lab Report",
      description: "Revoked access from Metro Health Clinic after consultation completed"
    }
  ];

  private mockNotifications: Notification[] = [
    {
      id: "N001",
      type: "info",
      title: "New Provider Access",
      message: "Dr. Sarah Johnson has accessed your lab report (Token #NFT001)",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      persistent: true,
      actionRequired: false,
      relatedTokenID: "NFT001"
    },
    {
      id: "N002",
      type: "warning",
      title: "Unacknowledged Check-in",
      message: "You have an unacknowledged patient check-in from 24 hours ago",
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      persistent: true,
      actionRequired: true
    },
    {
      id: "N003",
      type: "success",
      title: "Access Granted",
      message: "Successfully granted access to Metro Health Clinic for Token #NFT003",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      persistent: false,
      actionRequired: false,
      relatedTokenID: "NFT003"
    }
  ];

  async getDataNFTs(): Promise<DataNFT[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.mockDataNFTs];
  }

  async grantAccess(tokenID: string, providerAddress: string): Promise<void> {
    console.log(`Granting access for token ${tokenID} to ${providerAddress}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update mock data
    const nft = this.mockDataNFTs.find(n => n.tokenID === tokenID);
    if (nft) {
      nft.isShared = true;
      if (!nft.sharedWith.includes(providerAddress)) {
        nft.sharedWith.push(providerAddress);
      }
    }

    // Add consent event
    const newEvent: ConsentEvent = {
      id: `CE${Date.now()}`,
      type: "grant",
      timestamp: new Date().toISOString(),
      providerName: `Provider ${providerAddress.slice(0, 6)}`,
      providerAddress,
      tokenID,
      recordType: nft?.recordType || "Unknown",
      description: `Granted access to provider ${providerAddress.slice(0, 6)}...${providerAddress.slice(-4)}`
    };
    
    this.mockConsentEvents.unshift(newEvent);
  }

  async revokeAccess(tokenID: string, providerAddress: string): Promise<void> {
    console.log(`Revoking access for token ${tokenID} from ${providerAddress}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update mock data
    const nft = this.mockDataNFTs.find(n => n.tokenID === tokenID);
    if (nft) {
      nft.sharedWith = nft.sharedWith.filter(addr => addr !== providerAddress);
      if (nft.sharedWith.length === 0) {
        nft.isShared = false;
      }
    }

    // Add consent event
    const newEvent: ConsentEvent = {
      id: `CE${Date.now()}`,
      type: "revoke",
      timestamp: new Date().toISOString(),
      providerName: `Provider ${providerAddress.slice(0, 6)}`,
      providerAddress,
      tokenID,
      recordType: nft?.recordType || "Unknown",
      description: `Revoked access from provider ${providerAddress.slice(0, 6)}...${providerAddress.slice(-4)}`
    };
    
    this.mockConsentEvents.unshift(newEvent);
  }

  async getConsentEvents(): Promise<ConsentEvent[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.mockConsentEvents].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getNotifications(): Promise<Notification[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...this.mockNotifications];
  }

  async checkWalletConnection(): Promise<string | null> {
    // Simulate checking for connected wallet
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Mock connected wallet address
      return "0x742d35Cc6634C0532925a3b8D26C4c4e4C8b7b8c";
    }
    return null;
  }

  async getConsentActivity() {
    // Simulate consent activity data
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'consent-1',
        provider: 'Dr. Smith',
        dataType: 'Clinical Notes',
        status: 'granted',
        date: '2024-01-15',
        expiryDate: '2025-01-15'
      },
      {
        id: 'consent-2',
        provider: 'Research Institute',
        dataType: 'Lab Results', 
        status: 'pending',
        date: '2024-01-20',
        expiryDate: '2024-07-20'
      },
      {
        id: 'consent-3',
        provider: 'Hospital Network',
        dataType: 'All Records',
        status: 'granted',
        date: '2024-01-10',
        expiryDate: '2024-12-10'
      }
    ];
  }

  async connectWallet(): Promise<string> {
    console.log('Connecting to Web3 wallet...');
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // In a real app, this would use Web3 library
      const mockAddress = "0x742d35Cc6634C0532925a3b8D26C4c4e4C8b7b8c";
      console.log('Connected to wallet:', mockAddress);
      return mockAddress;
    } else {
      throw new Error('MetaMask not detected');
    }
  }

  async exportWalletKey(password: string): Promise<void> {
    console.log('Exporting wallet key with password protection...');
    
    // Simulate encryption and file creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock encrypted data
    const walletData = {
      privateKey: "mock_encrypted_private_key_" + Date.now(),
      address: "0x742d35Cc6634C0532925a3b8D26C4c4e4C8b7b8c",
      metadata: {
        exportDate: new Date().toISOString(),
        version: "1.0"
      }
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(walletData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async exportDataNFTs(): Promise<void> {
    console.log('Exporting DataNFT metadata...');
    
    const exportData = {
      exportDate: new Date().toISOString(),
      dataNFTs: this.mockDataNFTs,
      totalCount: this.mockDataNFTs.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datanfts-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async exportConsentHistory(): Promise<void> {
    console.log('Exporting consent history...');
    
    // Convert to CSV format
    const headers = ['ID', 'Type', 'Timestamp', 'Provider Name', 'Provider Address', 'Token ID', 'Record Type', 'Description'];
    const csvData = [
      headers.join(','),
      ...this.mockConsentEvents.map(event => [
        event.id,
        event.type,
        event.timestamp,
        `"${event.providerName}"`,
        event.providerAddress,
        event.tokenID,
        event.recordType,
        `"${event.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-history-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getFollowUpTasks() {
    // Simulate follow-up tasks
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'task-1',
        type: 'immediate_summary',
        patientId: 'pt-001',
        patientName: 'John Smith',
        visitDate: '2024-01-15T14:30:00Z',
        dueDate: '2024-01-15T15:30:00Z',
        status: 'completed',
        priority: 'high',
        method: 'email',
        content: 'Your visit summary and next steps are ready for review.',
        response: 'Thank you for the summary. Very helpful!',
        responseDate: '2024-01-15T16:45:00Z',
        attempts: 1,
        maxAttempts: 3
      },
      {
        id: 'task-2',
        type: '24h_checkin',
        patientId: 'pt-002',
        patientName: 'Sarah Johnson',
        visitDate: '2024-01-14T10:00:00Z',
        dueDate: '2024-01-15T10:00:00Z',
        status: 'pending',
        priority: 'medium',
        method: 'sms',
        content: 'How are you feeling today? Please rate your pain level 1-10.',
        attempts: 0,
        maxAttempts: 2
      },
      {
        id: 'task-3',
        type: '1week_reminder',
        patientId: 'pt-003',
        patientName: 'Michael Davis',
        visitDate: '2024-01-08T16:15:00Z',
        dueDate: '2024-01-15T16:15:00Z',
        status: 'sent',
        priority: 'low',
        method: 'app_notification',
        content: 'Weekly check-in: How is your medication working?',
        attempts: 1,
        maxAttempts: 2
      }
    ];
  }
}

export const patientPortalService = new PatientPortalService();
