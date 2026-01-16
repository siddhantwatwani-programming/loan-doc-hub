import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createMagicLink } from '@/lib/magicLink';
import { logParticipantInvited, logParticipantRemoved } from '@/hooks/useActivityLog';
import { getRoleDisplayName, getRoleBadgeClasses } from '@/lib/accessControl';
import { 
  UserPlus, 
  Loader2, 
  Mail, 
  Link2, 
  Users,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type ParticipantStatus = Database['public']['Enums']['participant_status'];

interface Participant {
  id: string;
  deal_id: string;
  role: AppRole;
  user_id: string | null;
  access_method: 'login' | 'magic_link';
  sequence_order: number | null;
  status: ParticipantStatus;
  invited_at: string;
  completed_at: string | null;
  email?: string;
  name?: string;
}

interface InviteParticipantsPanelProps {
  dealId: string;
  dealNumber: string;
}

const EXTERNAL_ROLES: { value: AppRole; label: string }[] = [
  { value: 'borrower', label: 'Borrower' },
  { value: 'broker', label: 'Broker' },
  { value: 'lender', label: 'Lender' },
];

const statusConfig: Record<ParticipantStatus, { label: string; color: string; icon: React.ElementType }> = {
  invited: { label: 'Invited', color: 'bg-muted text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary', icon: Users },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  expired: { label: 'Expired', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

export const InviteParticipantsPanel: React.FC<InviteParticipantsPanelProps> = ({
  dealId,
  dealNumber,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [selectedRole, setSelectedRole] = useState<AppRole>('borrower');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [accessMethod, setAccessMethod] = useState<'login' | 'magic_link'>('magic_link');
  const [entryMode, setEntryMode] = useState<'parallel' | 'sequential'>('parallel');
  const [sequenceOrder, setSequenceOrder] = useState<number>(1);

  useEffect(() => {
    fetchParticipants();
  }, [dealId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deal_participants')
        .select('*')
        .eq('deal_id', dealId)
        .order('sequence_order', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setParticipants((data || []) as Participant[]);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRoles = () => {
    const usedRoles = new Set(participants.map(p => p.role));
    return EXTERNAL_ROLES.filter(r => !usedRoles.has(r.value));
  };

  const handleInvite = async () => {
    if (!email || !selectedRole) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // 1. Create deal participant
      const participantData = {
        deal_id: dealId,
        role: selectedRole,
        access_method: accessMethod,
        sequence_order: entryMode === 'sequential' ? sequenceOrder : null,
        status: 'invited' as ParticipantStatus,
      };

      const { data: participant, error: participantError } = await supabase
        .from('deal_participants')
        .insert(participantData)
        .select()
        .single();

      if (participantError) throw participantError;

      // 2. Create magic link if applicable
      let magicLinkUrl: string | null = null;
      if (accessMethod === 'magic_link' && user?.id) {
        const { url, error: magicError } = await createMagicLink(
          participant.id,
          user.id
        );
        if (magicError) {
          console.error('Error creating magic link:', magicError);
        } else {
          magicLinkUrl = url;
        }
      }

      // 3. Send invite email
      const { error: emailError } = await supabase.functions.invoke('send-participant-invite', {
        body: {
          participantId: participant.id,
          email,
          name: name || undefined,
          accessMethod,
          magicLinkUrl,
          dealNumber,
          role: selectedRole,
        },
      });

      if (emailError) {
        console.error('Error sending invite:', emailError);
        toast({
          title: 'Warning',
          description: 'Participant added but email could not be sent',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Invite Sent',
          description: `Invitation sent to ${email}`,
        });
      }

      // 4. Log activity
      await logParticipantInvited(dealId, {
        role: selectedRole,
        email,
        accessMethod,
      });

      // Reset form and refresh
      setIsDialogOpen(false);
      resetForm();
      fetchParticipants();

    } catch (error: any) {
      console.error('Error inviting participant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite participant',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      const { error } = await supabase
        .from('deal_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      toast({ title: 'Participant removed' });
      fetchParticipants();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove participant',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvite = async (participant: Participant) => {
    // For now, show a placeholder - would need to store email separately or in profiles
    toast({
      title: 'Resend Invite',
      description: 'This feature requires the participant email to be stored. Coming soon!',
    });
  };

  const resetForm = () => {
    const available = getAvailableRoles();
    setSelectedRole(available[0]?.value || 'borrower');
    setEmail('');
    setName('');
    setAccessMethod('magic_link');
    setEntryMode('parallel');
    setSequenceOrder(participants.length + 1);
  };

  const availableRoles = getAvailableRoles();
  const canAddMore = availableRoles.length > 0;

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Participants</h3>
        </div>
        {canAddMore && (
          <Button 
            size="sm" 
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No participants invited yet</p>
          {canAddMore && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 gap-2"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              Invite First Participant
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => {
            const StatusIcon = statusConfig[participant.status].icon;
            return (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    getRoleBadgeClasses(participant.role)
                  )}>
                    {participant.role.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground capitalize">
                        {getRoleDisplayName(participant.role)}
                      </span>
                      <Badge variant="outline" className="text-xs gap-1">
                        {participant.access_method === 'magic_link' ? (
                          <><Link2 className="h-3 w-3" /> Magic Link</>
                        ) : (
                          <><Mail className="h-3 w-3" /> Login</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs gap-1', statusConfig[participant.status].color)}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[participant.status].label}
                      </Badge>
                      {participant.sequence_order && (
                        <span className="text-xs text-muted-foreground">
                          Order: {participant.sequence_order}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleResendInvite(participant)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Invite
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Participant</DialogTitle>
            <DialogDescription>
              Invite an external participant to this deal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select 
                value={selectedRole} 
                onValueChange={(v) => setSelectedRole(v as AppRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="participant@example.com"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            {/* Access Method */}
            <div className="space-y-3">
              <Label>Access Method</Label>
              <RadioGroup 
                value={accessMethod} 
                onValueChange={(v) => setAccessMethod(v as 'login' | 'magic_link')}
                className="grid grid-cols-2 gap-3"
              >
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                  accessMethod === 'magic_link' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                )}>
                  <RadioGroupItem value="magic_link" id="magic_link" />
                  <Label htmlFor="magic_link" className="flex items-center gap-2 cursor-pointer">
                    <Link2 className="h-4 w-4" />
                    Magic Link
                  </Label>
                </div>
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                  accessMethod === 'login' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                )}>
                  <RadioGroupItem value="login" id="login" />
                  <Label htmlFor="login" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    Login
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                {accessMethod === 'magic_link' 
                  ? 'Secure one-time link for quick access without registration'
                  : 'User must register/login to access the deal'
                }
              </p>
            </div>

            {/* Entry Mode */}
            <div className="space-y-3">
              <Label>Entry Mode</Label>
              <RadioGroup 
                value={entryMode} 
                onValueChange={(v) => setEntryMode(v as 'parallel' | 'sequential')}
                className="grid grid-cols-2 gap-3"
              >
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                  entryMode === 'parallel' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                )}>
                  <RadioGroupItem value="parallel" id="parallel" />
                  <Label htmlFor="parallel" className="cursor-pointer">Parallel</Label>
                </div>
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                  entryMode === 'sequential' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                )}>
                  <RadioGroupItem value="sequential" id="sequential" />
                  <Label htmlFor="sequential" className="cursor-pointer">Sequential</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Sequence Order */}
            {entryMode === 'sequential' && (
              <div className="space-y-2">
                <Label htmlFor="order">Sequence Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Order in which this participant should complete their tasks
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={sending} className="gap-2">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InviteParticipantsPanel;
