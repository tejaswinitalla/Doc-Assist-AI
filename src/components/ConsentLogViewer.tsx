
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Shield, UserCheck, UserX, Eye, FileText } from 'lucide-react';
import { patientPortalService } from '../services/patientPortalService';

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

const ConsentLogViewer = () => {
  const [events, setEvents] = useState<ConsentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'grant' | 'revoke' | 'view'>('all');

  useEffect(() => {
    loadConsentEvents();
  }, []);

  const loadConsentEvents = async () => {
    try {
      const consentEvents = await patientPortalService.getConsentEvents();
      setEvents(consentEvents);
    } catch (error) {
      console.error('Failed to load consent events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'grant':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'revoke':
        return <UserX className="w-4 h-4 text-red-600" />;
      case 'view':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'export':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'grant':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'revoke':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'view':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'export':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.type === filter);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Consent Activity Timeline
          </CardTitle>
          <CardDescription>
            Track all access grants, revocations, and data views for your DataNFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All Events ({events.length})
            </Button>
            <Button
              variant={filter === 'grant' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('grant')}
              className="bg-green-500 hover:bg-green-600"
            >
              Access Granted ({events.filter(e => e.type === 'grant').length})
            </Button>
            <Button
              variant={filter === 'revoke' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('revoke')}
              className="bg-red-500 hover:bg-red-600"
            >
              Access Revoked ({events.filter(e => e.type === 'revoke').length})
            </Button>
            <Button
              variant={filter === 'view' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('view')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Data Viewed ({events.filter(e => e.type === 'view').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-slate-500">No consent events found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            
            {filteredEvents.map((event, index) => {
              const { date, time } = formatTimestamp(event.timestamp);
              
              return (
                <div key={event.id} className="relative flex items-start space-x-4 pb-6">
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-slate-200 rounded-full">
                    {getEventIcon(event.type)}
                  </div>
                  
                  {/* Event Card */}
                  <Card className="flex-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge className={getEventColor(event.type)}>
                              {event.type.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              Token #{event.tokenID}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {event.recordType}
                            </Badge>
                          </div>
                          
                          <p className="font-medium text-slate-900">
                            {event.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <span>Provider: {event.providerName}</span>
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                              {event.providerAddress.slice(0, 6)}...{event.providerAddress.slice(-4)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-slate-500 ml-4">
                          <div>{date}</div>
                          <div className="font-medium">{time}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentLogViewer;
