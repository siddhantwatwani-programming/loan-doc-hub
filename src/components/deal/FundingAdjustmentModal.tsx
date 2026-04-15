import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LenderIdSearch } from './LenderIdSearch';
import { numericKeyDown, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';
import { toast } from 'sonner';
import type { FundingRecord } from './LoanFundingGrid';

export interface AdjustmentLenderRow {
  id: string;
  lenderId: string;
  name: string;
  currentBalance: string;
  adjustment: string;
  proRata: string;
  lenderRate: string;
  payment: string;
}

export interface FundingAdjustmentData {
  id: string;
  account: string;
  borrower: string;
  loanBalance: string;
  adjustmentAmount: string;
  asOfDate: string;
  distributeByProRata: boolean;
  lenders: AdjustmentLenderRow[];
  description: string;
  descriptionType: string;
  createdAt: string;
  updatedAt: string;
}

interface FundingAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanNumber?: string;
  borrowerName?: string;
  loanBalance?: number;
  fundingRecords?: FundingRecord[];
  existingAdjustments?: FundingAdjustmentData[];
  onSave: (adjustment: FundingAdjustmentData) => void;
  editData?: FundingAdjustmentData | null;
}

const DESCRIPTION_TYPE_OPTIONS = [
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'correction', label: 'Correction' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'forgiveness', label: 'Forgiveness' },
  { value: 'paid_away_from_us', label: 'Paid Away From Us' },
  { value: 'other', label: 'Other' },
];

const safeParseFloat = (v: string | undefined): number => {
  if (!v) return 0;
  return parseFloat((v || '').replace(/[$,]/g, '')) || 0;
};

export const FundingAdjustmentModal: React.FC<FundingAdjustmentModalProps> = ({
  open,
  onOpenChange,
  loanNumber = '',
  borrowerName = '',
  loanBalance = 0,
  fundingRecords = [],
  existingAdjustments = [],
  onSave,
  editData = null,
}) => {
  const [account, setAccount] = useState(loanNumber);
  const [borrower, setBorrower] = useState(borrowerName);
  const [balance, setBalance] = useState(
    loanBalance > 0 ? formatCurrencyDisplay(String(loanBalance)) : ''
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [asOfDate, setAsOfDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [distributeByProRata, setDistributeByProRata] = useState(false);
  const [lenders, setLenders] = useState<AdjustmentLenderRow[]>([]);
  const [description, setDescription] = useState('');
  const [descriptionType, setDescriptionType] = useState('');

  // Initialize from editData or fundingRecords
  useEffect(() => {
    if (!open) return;

    if (editData) {
      setAccount(editData.account);
      setBorrower(editData.borrower);
      setBalance(editData.loanBalance);
      setAdjustmentAmount(editData.adjustmentAmount);
      setAsOfDate(editData.asOfDate ? new Date(editData.asOfDate) : undefined);
      setDistributeByProRata(editData.distributeByProRata);
      setLenders(editData.lenders);
      setDescription(editData.description);
      setDescriptionType(editData.descriptionType);
    } else {
      setAccount(loanNumber);
      setBorrower(borrowerName);
      setBalance(loanBalance > 0 ? formatCurrencyDisplay(String(loanBalance)) : '');
      setAdjustmentAmount('');
      setAsOfDate(undefined);
      setDistributeByProRata(false);
      setDescription('');
      setDescriptionType('');

      // Pre-populate lender rows from existing funding records
      if (fundingRecords.length > 0) {
        setLenders(
          fundingRecords.map((r) => ({
            id: `adj-${r.id}`,
            lenderId: r.lenderAccount,
            name: r.lenderName,
            currentBalance: formatCurrencyDisplay(String(r.principalBalance)),
            adjustment: '',
            proRata: `${r.pctOwned.toFixed(3)}`,
            lenderRate: `${r.lenderRate.toFixed(3)}`,
            payment: formatCurrencyDisplay(String(r.regularPayment)),
          }))
        );
      } else {
        setLenders([]);
      }
    }
  }, [open, editData, loanNumber, borrowerName, loanBalance, fundingRecords]);

  // Distribute by Pro Rata
  useEffect(() => {
    if (!distributeByProRata || !adjustmentAmount) return;
    const totalAdj = safeParseFloat(adjustmentAmount);
    if (totalAdj === 0) return;

    setLenders((prev) =>
      prev.map((l) => {
        const proRata = parseFloat(l.proRata) || 0;
        const share = (totalAdj * proRata) / 100;
        return { ...l, adjustment: formatCurrencyDisplay(share.toFixed(2)) };
      })
    );
  }, [distributeByProRata, adjustmentAmount]);

  const handleAddLender = () => {
    setLenders((prev) => [
      ...prev,
      {
        id: `adj-new-${Date.now()}`,
        lenderId: '',
        name: '',
        currentBalance: '',
        adjustment: '',
        proRata: '',
        lenderRate: '',
        payment: '',
      },
    ]);
  };

  const handleRemoveLender = (id: string) => {
    setLenders((prev) => prev.filter((l) => l.id !== id));
  };

  const handleLenderChange = (id: string, field: keyof AdjustmentLenderRow, value: string) => {
    setLenders((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleLenderSelect = (id: string, lenderId: string, lenderName: string) => {
    // Auto-fill from funding records
    const fundingMatch = fundingRecords.find(
      (r) => r.lenderAccount === lenderId || r.lenderName === lenderName
    );
    setLenders((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              lenderId,
              name: lenderName,
              currentBalance: fundingMatch
                ? formatCurrencyDisplay(String(fundingMatch.principalBalance))
                : l.currentBalance,
              proRata: fundingMatch ? `${fundingMatch.pctOwned.toFixed(3)}` : l.proRata,
              lenderRate: fundingMatch ? `${fundingMatch.lenderRate.toFixed(3)}` : l.lenderRate,
              payment: fundingMatch
                ? formatCurrencyDisplay(String(fundingMatch.regularPayment))
                : l.payment,
            }
          : l
      )
    );
  };

  // Compute totals
  const totalCurrentBalance = lenders.reduce(
    (sum, l) => sum + safeParseFloat(l.currentBalance),
    0
  );
  const totalAdjustment = lenders.reduce(
    (sum, l) => sum + safeParseFloat(l.adjustment),
    0
  );

  const handleSave = () => {
    if (!adjustmentAmount && totalAdjustment === 0) {
      toast.error('Please enter an adjustment amount');
      return;
    }

    const data: FundingAdjustmentData = {
      id: editData?.id || `fundadj-${Date.now()}`,
      account,
      borrower,
      loanBalance: balance,
      adjustmentAmount: adjustmentAmount || formatCurrencyDisplay(totalAdjustment.toFixed(2)),
      asOfDate: asOfDate ? format(asOfDate, 'yyyy-MM-dd') : '',
      distributeByProRata,
      lenders,
      description,
      descriptionType,
      createdAt: editData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(data);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">Funding Adjustment</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Header Fields - Left side and Distribute checkbox */}
          <div className="flex items-start justify-between gap-6">
            {/* Left header fields */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium min-w-[110px]">Account</Label>
                <Input
                  value={account}
                  readOnly
                  className="h-7 text-xs w-40 bg-muted/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium min-w-[110px]">Borrower</Label>
                <Input
                  value={borrower}
                  readOnly
                  className="h-7 text-xs w-40 bg-muted/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium min-w-[110px]">Loan Balance</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    value={balance}
                    readOnly
                    className="h-7 text-xs w-40 pl-5 bg-muted/30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium min-w-[110px]">Adjustment Amount</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    onKeyDown={numericKeyDown}
                    onBlur={() => {
                      if (adjustmentAmount) {
                        setAdjustmentAmount(formatCurrencyDisplay(adjustmentAmount));
                      }
                    }}
                    className="h-7 text-xs w-40 pl-5"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium min-w-[110px]">As of Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-7 w-40 text-xs justify-start text-left font-normal',
                        !asOfDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {asOfDate ? format(asOfDate, 'MM/dd/yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EnhancedCalendar
                      mode="single"
                      selected={asOfDate}
                      onSelect={(date) => {
                        setAsOfDate(date);
                        setDatePickerOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Right side - Distribute checkbox + Add button */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={distributeByProRata}
                  onCheckedChange={(checked) => setDistributeByProRata(checked === true)}
                  id="distribute-pro-rata"
                />
                <Label htmlFor="distribute-pro-rata" className="text-xs font-medium cursor-pointer">
                  Distribute by Pro Rata
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleAddLender}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>

          {/* Lender Grid */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs min-w-[90px]">Lender ID</TableHead>
                    <TableHead className="text-xs min-w-[100px]">Name</TableHead>
                    <TableHead className="text-xs min-w-[110px] text-right">Current Balance</TableHead>
                    <TableHead className="text-xs min-w-[100px] text-right">Adjustment</TableHead>
                    <TableHead className="text-xs min-w-[70px] text-right">Pro Rata</TableHead>
                    <TableHead className="text-xs min-w-[80px] text-right">Lender Rate</TableHead>
                    <TableHead className="text-xs min-w-[90px] text-right">Payment</TableHead>
                    <TableHead className="text-xs w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lenders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6 text-xs">
                        No lenders. Click "Add" to add a lender row.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lenders.map((lender) => (
                      <TableRow key={lender.id}>
                        <TableCell className="py-1 px-1">
                          <LenderIdSearch
                            value={lender.lenderId}
                            onChange={(lenderId, lenderFullName) => handleLenderSelect(lender.id, lenderId, lenderFullName)}
                            className="h-6 text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <Input
                            value={lender.name}
                            onChange={(e) => handleLenderChange(lender.id, 'name', e.target.value)}
                            className="h-6 text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                            <Input
                              value={lender.currentBalance}
                              onChange={(e) => handleLenderChange(lender.id, 'currentBalance', e.target.value)}
                              onKeyDown={numericKeyDown}
                              onBlur={() => {
                                if (lender.currentBalance) {
                                  handleLenderChange(lender.id, 'currentBalance', formatCurrencyDisplay(lender.currentBalance));
                                }
                              }}
                              className="h-6 text-xs pl-4 text-right"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                            <Input
                              value={lender.adjustment}
                              onChange={(e) => handleLenderChange(lender.id, 'adjustment', e.target.value)}
                              onKeyDown={numericKeyDown}
                              onBlur={() => {
                                if (lender.adjustment) {
                                  handleLenderChange(lender.id, 'adjustment', formatCurrencyDisplay(lender.adjustment));
                                }
                              }}
                              className="h-6 text-xs pl-4 text-right"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <div className="relative">
                            <Input
                              value={lender.proRata}
                              onChange={(e) => handleLenderChange(lender.id, 'proRata', e.target.value)}
                              onKeyDown={numericKeyDown}
                              className="h-6 text-xs text-right pr-5"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <div className="relative">
                            <Input
                              value={lender.lenderRate}
                              onChange={(e) => handleLenderChange(lender.id, 'lenderRate', e.target.value)}
                              onKeyDown={numericKeyDown}
                              className="h-6 text-xs text-right pr-5"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                            <Input
                              value={lender.payment}
                              onChange={(e) => handleLenderChange(lender.id, 'payment', e.target.value)}
                              onKeyDown={numericKeyDown}
                              onBlur={() => {
                                if (lender.payment) {
                                  handleLenderChange(lender.id, 'payment', formatCurrencyDisplay(lender.payment));
                                }
                              }}
                              className="h-6 text-xs pl-4 text-right"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveLender(lender.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Totals Row */}
                  {lenders.length > 0 && (
                    <TableRow className="bg-muted/30 font-semibold border-t-2">
                      <TableCell className="text-xs py-1 px-1" />
                      <TableCell className="text-xs py-1 px-1 font-semibold">Total</TableCell>
                      <TableCell className="text-xs py-1 px-1 text-right font-semibold">
                        {formatCurrency(totalCurrentBalance)}
                      </TableCell>
                      <TableCell className="text-xs py-1 px-1 text-right font-semibold">
                        {formatCurrency(totalAdjustment)}
                      </TableCell>
                      <TableCell className="text-xs py-1 px-1" />
                      <TableCell className="text-xs py-1 px-1" />
                      <TableCell className="text-xs py-1 px-1" />
                      <TableCell className="text-xs py-1 px-1" />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Description and Type */}
          <div className="flex items-end gap-4 justify-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-7 text-xs w-44"
                placeholder="Description"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={descriptionType} onValueChange={setDescriptionType}>
                <SelectTrigger className="h-7 text-xs w-44">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DESCRIPTION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Adjustment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FundingAdjustmentModal;
