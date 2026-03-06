import React, { useMemo } from 'react';
import { useFormPermissionsAdmin } from '@/hooks/useFormPermissions';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Eye, Lock, Loader2, ShieldCheck } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const FORM_LABELS: Record<string, string> = {
  borrower: 'Borrower',
  co_borrower: 'Co-Borrower',
  property: 'Property',
  loan_terms: 'Loan Terms',
  lender: 'Lender',
  broker: 'Broker',
  charges: 'Charges',
  notes: 'Notes / Conversation Log',
  insurance: 'Insurance',
  liens: 'Liens',
  origination: 'Origination',
  trust_ledger: 'Trust Ledger',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  csr: 'CSR',
  borrower: 'Borrower',
  broker: 'Broker',
  lender: 'Lender',
};

const PERMISSION_LEVEL_LABELS: Record<string, string> = {
  full: 'Full',
  limited: 'Limited',
  view_only: 'View-Only',
};

const PERMISSION_LEVELS = ['full', 'limited', 'view_only'];

const ROLES = ['admin', 'csr'];

const PermissionManagementPage: React.FC = () => {
  const { allPermissions, loading, updatePermission, ensureLevelPermissions } = useFormPermissionsAdmin();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = React.useState<string>('csr');
  const [selectedLevel, setSelectedLevel] = React.useState<string>('full');

  // Auto-seed level-specific permissions when a CSR level is selected
  React.useEffect(() => {
    if (selectedRole === 'csr' && selectedLevel !== 'full' && !loading) {
      ensureLevelPermissions(selectedLevel);
    }
  }, [selectedRole, selectedLevel, loading]);

  const filteredPermissions = useMemo(() => {
    if (selectedRole === 'csr') {
      if (selectedLevel === 'full') {
        // "Full" level uses the base CSR permissions (no permission_level set)
        return allPermissions.filter(p => p.role === 'csr' && !p.permission_level);
      }
      // For limited/view_only, filter by permission_level
      return allPermissions.filter(p => p.role === 'csr' && (p as any).permission_level === selectedLevel);
    }
    return allPermissions.filter(p => p.role === selectedRole && !(p as any).permission_level);
  }, [allPermissions, selectedRole, selectedLevel]);

  const handleToggle = async (id: string, currentMode: string) => {
    const newMode = currentMode === 'editable' ? 'view_only' : 'editable';
    const permLevel = selectedRole === 'csr' ? selectedLevel : null;
    try {
      await updatePermission(id, newMode as 'editable' | 'view_only');
      toast({
        title: 'Permission updated',
        description: `Form access changed to ${newMode === 'editable' ? 'Editable' : 'View-Only'}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Permission Management</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Manage form access and screen visibility permissions for each role
        </p>
      </div>

      {/* Role Selector */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-foreground">Role:</span>
        <Select value={selectedRole} onValueChange={(val) => {
          setSelectedRole(val);
          if (val !== 'csr') setSelectedLevel('full');
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(r => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRole === 'csr' && (
          <>
            <span className="text-sm font-medium text-foreground">Permission Level:</span>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_LEVELS.map(l => (
                  <SelectItem key={l} value={l}>{PERMISSION_LEVEL_LABELS[l]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Permissions Grid */}
      <div className="section-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Form Name</TableHead>
              <TableHead className="w-[180px]">Form Access</TableHead>
              <TableHead className="w-[150px]">Editable / View-Only</TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                  Screen Visibility
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Screen visibility control will be available in a future release
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.map((perm) => (
              <TableRow key={perm.id}>
                <TableCell className="font-medium">
                  {FORM_LABELS[perm.form_key] || perm.form_key}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={perm.access_mode === 'editable' ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    {perm.access_mode === 'editable' ? (
                      <>
                        <ShieldCheck className="h-3 w-3" />
                        Editable
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        View-Only
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={perm.access_mode === 'editable'}
                    onCheckedChange={() => handleToggle(perm.id, perm.access_mode)}
                  />
                </TableCell>
                <TableCell>
                  {/* Placeholder icon for Screen Visibility - no functionality */}
                  <Tooltip>
                    <TooltipTrigger>
                      <Eye className="h-5 w-5 text-muted-foreground/50 cursor-not-allowed" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Screen visibility – coming soon
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredPermissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No permissions configured for this role
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PermissionManagementPage;
