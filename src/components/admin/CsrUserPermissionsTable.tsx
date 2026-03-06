import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CsrUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  permission_level: string;
}

const PERMISSION_LEVEL_LABELS: Record<string, string> = {
  full: 'Full',
  limited: 'Limited',
  view_only: 'View-Only',
};

const PERMISSION_LEVELS = ['full', 'limited', 'view_only'];

const CsrUserPermissionsTable: React.FC = () => {
  const [csrUsers, setCsrUsers] = useState<CsrUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCsrUsers = async () => {
    try {
      setLoading(true);

      // Get all users with CSR role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'csr');

      if (roleError) throw roleError;
      if (!roleData || roleData.length === 0) {
        setCsrUsers([]);
        setLoading(false);
        return;
      }

      const userIds = roleData.map(r => r.user_id);

      // Get profiles for these users
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Get permission levels for these users
      const { data: permLevelData, error: permError } = await supabase
        .from('user_permission_levels')
        .select('user_id, permission_level')
        .in('user_id', userIds);

      if (permError) throw permError;

      const permMap = new Map((permLevelData || []).map(p => [p.user_id, p.permission_level]));

      const users: CsrUser[] = userIds.map(uid => {
        const profile = (profileData || []).find(p => p.user_id === uid);
        return {
          user_id: uid,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          permission_level: permMap.get(uid) || 'full',
        };
      });

      // Sort by name then email
      users.sort((a, b) => {
        const nameA = a.full_name || a.email || '';
        const nameB = b.full_name || b.email || '';
        return nameA.localeCompare(nameB);
      });

      setCsrUsers(users);
    } catch (err) {
      console.error('Error fetching CSR users:', err);
      toast({
        title: 'Error',
        description: 'Failed to load CSR users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCsrUsers();
  }, []);

  const handlePermissionChange = async (userId: string, newLevel: string) => {
    try {
      const { error } = await supabase.rpc('assign_user_role_and_permission', {
        p_user_id: userId,
        p_role: 'csr',
        p_permission_level: newLevel,
      });

      if (error) throw error;

      setCsrUsers(prev =>
        prev.map(u => u.user_id === userId ? { ...u, permission_level: newLevel } : u)
      );

      toast({
        title: 'Permission updated',
        description: `User permission level changed to ${PERMISSION_LEVEL_LABELS[newLevel] || newLevel}`,
      });
    } catch (err) {
      console.error('Error updating permission level:', err);
      toast({
        title: 'Error',
        description: 'Failed to update permission level',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">CSR Users</h2>
        <Badge variant="outline" className="ml-2">{csrUsers.length} users</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead className="w-[300px]">Email</TableHead>
            <TableHead className="w-[200px]">Permission Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {csrUsers.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell className="font-medium">
                {user.full_name || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.email || '—'}
              </TableCell>
              <TableCell>
                <Select
                  value={user.permission_level}
                  onValueChange={(val) => handlePermissionChange(user.user_id, val)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_LEVELS.map(l => (
                      <SelectItem key={l} value={l}>
                        {PERMISSION_LEVEL_LABELS[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {csrUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                No CSR users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CsrUserPermissionsTable;
