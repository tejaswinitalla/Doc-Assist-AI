import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Clock, Users, Search, Filter, 
  CheckCircle, XCircle, AlertCircle, Eye,
  Calendar, Building2, FileText, Download
} from 'lucide-react';

interface ConsentEvent {
  id: string;
  type: 'grant' | 'revoke' | 'view' | 'export' | 'update';
  timestamp: string;
  providerName: string;
  providerAddress: string;
  tokenID: string;
  recordType: string;
  description: string;
  status: 'active' | 'expired' | 'revoked';
  expiryDate?: string;
  accessLevel?: 'read' | 'write' | 'full';
  purpose?: string;
}

interface ConsentTimelineProps {
  consentEvents: ConsentEvent[];
}

const ConsentTimeline: React.FC<ConsentTimelineProps> = ({ consentEvents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState<ConsentEvent[]>(consentEvents);

  useEffect(() => {
    let filtered = consentEvents;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tokenID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.recordType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(event => 
        new Date(event.timestamp) >= filterDate
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredEvents(filtered);
  }, [searchTerm, typeFilter, statusFilter, timeFilter, consentEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'grant': return <CheckCircle className="w-5 h-5 text-medical-success" />;
      case 'revoke': return <XCircle className="w-5 h-5 text-medical-error" />;
      case 'view': return <Eye className="w-5 h-5 text-primary" />;
      case 'export': return <Download className="w-5 h-5 text-medical-teal" />;
      case 'update': return <AlertCircle className="w-5 h-5 text-medical-warning" />;
      default: return <Shield className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-medical-success text-white">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'revoked':
        return <Badge className="bg-medical-error text-white">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccessLevelColor = (level?: string) => {
    switch (level) {
      case 'read': return 'text-medical-success';
      case 'write': return 'text-medical-warning';
      case 'full': return 'text-medical-error';
      default: return 'text-muted-foreground';
    }
  };

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, ConsentEvent[]>);

  const getConsentStats = () => {
    const activeConsents = consentEvents.filter(e => e.status === 'active' && e.type === 'grant').length;
    const totalViews = consentEvents.filter(e => e.type === 'view').length;
    const revokedConsents = consentEvents.filter(e => e.type === 'revoke').length;
    
    return { activeConsents, totalViews, revokedConsents };
  };

  const stats = getConsentStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="medical-card p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <Shield className="w-6 h-6 mr-3 text-primary" />
              Consent Timeline
            </h2>
            <p className="text-muted-foreground mt-1">
              Track all data access permissions and activities
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-medical-success">{stats.activeConsents}</p>
              <p className="text-sm text-muted-foreground">Active Consents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalViews}</p>
              <p className="text-sm text-muted-foreground">Data Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-medical-warning">{stats.revokedConsents}</p>
              <p className="text-sm text-muted-foreground">Revoked</p>
            </div>
          </div>
        </div>

        {/* Smart Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="grant">Grants</SelectItem>
              <SelectItem value="revoke">Revokes</SelectItem>
              <SelectItem value="view">Views</SelectItem>
              <SelectItem value="export">Exports</SelectItem>
              <SelectItem value="update">Updates</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="summary">Activity Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, events], dateIndex) => (
              <Card key={date} className="medical-card animate-slide-up" style={{animationDelay: `${dateIndex * 0.1}s`}}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary" />
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.map((event, eventIndex) => (
                      <div key={event.id} className="consent-timeline-item">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            {getEventIcon(event.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-semibold text-foreground capitalize">
                                    {event.type} Action
                                  </h4>
                                  {getStatusBadge(event.status)}
                                  {event.accessLevel && (
                                    <Badge variant="outline" className={getAccessLevelColor(event.accessLevel)}>
                                      {event.accessLevel.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2">
                                  {event.description}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center">
                                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>{event.providerName}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>Token #{event.tokenID}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                </div>

                                {event.purpose && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium">Purpose:</span> {event.purpose}
                                  </div>
                                )}

                                {event.expiryDate && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium">Expires:</span> {new Date(event.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No consent events found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                    ? "Try adjusting your filters to see more results." 
                    : "Your consent activities will appear here."
                  }
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="medical-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-medical-success rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-medical-success">{stats.activeConsents}</p>
                    <p className="text-sm text-muted-foreground">Active Consents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.totalViews}</p>
                    <p className="text-sm text-muted-foreground">Total Data Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-medical-warning rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-medical-warning">{stats.revokedConsents}</p>
                    <p className="text-sm text-muted-foreground">Revoked Access</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-medical-teal rounded-full flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-medical-teal">
                      {consentEvents.filter(e => e.type === 'export').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Data Exports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsentTimeline;