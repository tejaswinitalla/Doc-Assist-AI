import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, Phone, Mail, MessageCircle, CheckCircle, 
  AlertTriangle, Calendar, User, FileText, 
  Send, Bell, Eye, Star, ThumbsUp
} from 'lucide-react';

interface FollowUpTask {
  id: string;
  type: 'immediate_summary' | '24h_checkin' | '1week_reminder' | '1month_scheduling' | 'custom';
  patientId: string;
  patientName: string;
  visitDate: string;
  dueDate: string;
  status: 'pending' | 'sent' | 'responded' | 'missed' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  method: 'sms' | 'email' | 'phone' | 'app_notification';
  content?: string;
  response?: string;
  responseDate?: string;
  attempts: number;
  maxAttempts: number;
}

interface PostVisitFollowUpProps {
  followUpTasks: FollowUpTask[];
  onSendFollowUp: (taskId: string) => Promise<void>;
  onMarkCompleted: (taskId: string) => Promise<void>;
  onScheduleReminder: (taskId: string, reminderDate: string) => Promise<void>;
}

const PostVisitFollowUp: React.FC<PostVisitFollowUpProps> = ({
  followUpTasks,
  onSendFollowUp,
  onMarkCompleted,
  onScheduleReminder
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'immediate_summary':
        return <FileText className="w-4 h-4 text-primary" />;
      case '24h_checkin':
        return <Clock className="w-4 h-4 text-medical-warning" />;
      case '1week_reminder':
        return <Bell className="w-4 h-4 text-medical-teal" />;
      case '1month_scheduling':
        return <Calendar className="w-4 h-4 text-medical-success" />;
      default:
        return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-medical-success text-white">Completed</Badge>;
      case 'responded':
        return <Badge className="bg-primary text-white">Responded</Badge>;
      case 'sent':
        return <Badge className="bg-medical-teal text-white">Sent</Badge>;
      case 'missed':
        return <Badge className="bg-medical-error text-white">Missed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-medical-error bg-medical-error/5';
      case 'high':
        return 'border-l-medical-warning bg-medical-warning/5';
      case 'medium':
        return 'border-l-medical-teal bg-medical-teal/5';
      case 'low':
        return 'border-l-medical-success bg-medical-success/5';
      default:
        return 'border-l-muted bg-muted/5';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'sms':
        return <MessageCircle className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'app_notification':
        return <Bell className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getFollowUpStats = () => {
    const total = followUpTasks.length;
    const pending = followUpTasks.filter(task => task.status === 'pending').length;
    const completed = followUpTasks.filter(task => task.status === 'completed').length;
    const missed = followUpTasks.filter(task => task.status === 'missed').length;
    const responseRate = total > 0 ? ((completed / total) * 100) : 0;

    return { total, pending, completed, missed, responseRate };
  };

  const stats = getFollowUpStats();

  const overdueTasks = followUpTasks.filter(task => 
    task.status === 'pending' && new Date(task.dueDate) < new Date()
  );

  const upcomingTasks = followUpTasks.filter(task => 
    task.status === 'pending' && new Date(task.dueDate) >= new Date()
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="medical-card p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <Clock className="w-6 h-6 mr-3 text-primary" />
              Post-Visit Follow-Up
            </h2>
            <p className="text-muted-foreground mt-1">
              Automated patient engagement and care continuity
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-medical-warning">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-medical-success">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-medical-teal">{Math.round(stats.responseRate)}%</p>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
          </div>
        </div>

        <Progress value={stats.responseRate} className="w-full" />
        <p className="text-sm text-muted-foreground mt-2">
          Overall engagement rate across all follow-up communications
        </p>
      </div>

      {/* Alert for Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-l-4 border-l-medical-error bg-medical-error/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-medical-error mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">
                  {overdueTasks.length} Overdue Follow-Up{overdueTasks.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  These tasks need immediate attention to maintain care continuity.
                </p>
                <Button size="sm" className="bg-medical-error hover:bg-medical-error/80">
                  Review Overdue Tasks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Tasks */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTaskIcon(task.type)}
                        <div>
                          <p className="font-medium text-sm">{task.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(task.method)}
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Follow-Up Flow Timeline */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Standard Follow-Up Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium">Immediate Summary</p>
                      <p className="text-sm text-muted-foreground">Sent within 1 hour post-visit</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-medical-warning rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium">24-Hour Check-in</p>
                      <p className="text-sm text-muted-foreground">Wellness check and medication reminder</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-medical-teal rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium">1-Week Reminder</p>
                      <p className="text-sm text-muted-foreground">Care plan adherence and symptom tracking</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-medical-success rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                    <div>
                      <p className="font-medium">1-Month Scheduling</p>
                      <p className="text-sm text-muted-foreground">Follow-up appointment booking</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {followUpTasks
              .filter(task => task.status === 'pending')
              .map((task, index) => (
                <Card key={task.id} className={`medical-card border-l-4 ${getPriorityColor(task.priority)} animate-slide-up`} style={{animationDelay: `${index * 0.1}s`}}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {getTaskIcon(task.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-foreground">{task.patientName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {task.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${task.priority === 'urgent' ? 'text-medical-error' : ''}`}>
                              {task.priority.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Visit: {new Date(task.visitDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              {getMethodIcon(task.method)}
                              <span className="ml-2 capitalize">{task.method}</span>
                            </div>
                          </div>

                          {task.content && (
                            <div className="bg-muted/50 rounded p-3 text-sm">
                              <p className="font-medium mb-1">Message Preview:</p>
                              <p className="text-muted-foreground">{task.content.substring(0, 100)}...</p>
                            </div>
                          )}

                          <div className="flex items-center mt-3 text-xs text-muted-foreground">
                            <span>Attempts: {task.attempts}/{task.maxAttempts}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => onSendFollowUp(task.id)}
                          className="bg-primary hover:bg-primary/80"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send Now
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTask(task)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {followUpTasks
              .filter(task => ['completed', 'responded'].includes(task.status))
              .map((task, index) => (
                <Card key={task.id} className="medical-card animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <CheckCircle className="w-5 h-5 text-medical-success mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-foreground">{task.patientName}</h4>
                            {getStatusBadge(task.status)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2">
                            <p>{task.type.replace('_', ' ').toUpperCase()} - Completed {task.responseDate && new Date(task.responseDate).toLocaleDateString()}</p>
                          </div>

                          {task.response && (
                            <div className="bg-medical-success/10 border border-medical-success/20 rounded p-3 text-sm">
                              <p className="font-medium text-medical-success mb-1">Patient Response:</p>
                              <p className="text-foreground">{task.response}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-medical-warning" />
                        <ThumbsUp className="w-4 h-4 text-medical-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="text-lg">Response Rates by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['immediate_summary', '24h_checkin', '1week_reminder', '1month_scheduling'].map(type => {
                    const typeTasks = followUpTasks.filter(task => task.type === type);
                    const completed = typeTasks.filter(task => task.status === 'completed').length;
                    const rate = typeTasks.length > 0 ? (completed / typeTasks.length) * 100 : 0;
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <span className="font-medium">{Math.round(rate)}%</span>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="text-lg">Method Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['sms', 'email', 'phone', 'app_notification'].map(method => {
                    const methodTasks = followUpTasks.filter(task => task.method === method);
                    const completed = methodTasks.filter(task => task.status === 'completed').length;
                    const rate = methodTasks.length > 0 ? (completed / methodTasks.length) * 100 : 0;
                    
                    return (
                      <div key={method} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center">
                            {getMethodIcon(method)}
                            <span className="ml-2 capitalize">{method.replace('_', ' ')}</span>
                          </div>
                          <span className="font-medium">{Math.round(rate)}%</span>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-medium">2.4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patient Satisfaction</span>
                    <span className="font-medium">4.8/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missed Appointments</span>
                    <span className="font-medium text-medical-success">-23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medication Adherence</span>
                    <span className="font-medium text-medical-success">+15%</span>
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

export default PostVisitFollowUp;