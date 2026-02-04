import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LienSubNavigation, type LienSubSection } from './LienSubNavigation';
import { LiensTableView, type LienData } from './LiensTableView';
import { LienModal } from './LienModal';
import { LienDetailForm } from './LienDetailForm';
import { LienNoteForm } from './LienNoteForm';

interface LienSectionContentProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
  onBack?: () => void;
}

// Helper to extract liens from values based on lien prefix pattern
const extractLiensFromValues = (values: Record<string, string>): LienData[] => {
  const liens: LienData[] = [];
  const lienPrefixes = new Set<string>();
  
  // Find all lien prefixes (lien1, lien2, etc.)
  Object.keys(values).forEach(key => {
    const match = key.match(/^(lien\d+)\./);
    if (match) {
      lienPrefixes.add(match[1]);
    }
  });
  
  // Build lien objects from values
  lienPrefixes.forEach(prefix => {
    const lien: LienData = {
      id: prefix,
      property: values[`${prefix}.property`] || '',
      priority: values[`${prefix}.priority`] || '',
      holder: values[`${prefix}.holder`] || '',
      account: values[`${prefix}.account`] || '',
      contact: values[`${prefix}.contact`] || '',
      phone: values[`${prefix}.phone`] || '',
      originalBalance: values[`${prefix}.original_balance`] || '',
      currentBalance: values[`${prefix}.current_balance`] || '',
      regularPayment: values[`${prefix}.regular_payment`] || '',
      lastChecked: values[`${prefix}.last_checked`] || '',
      note: values[`${prefix}.note`] || '',
    };
    liens.push(lien);
  });
  
  // Sort to ensure lien1 comes first
  liens.sort((a, b) => {
    const numA = parseInt(a.id.replace('lien', ''));
    const numB = parseInt(b.id.replace('lien', ''));
    return numA - numB;
  });
  
  return liens;
};

// Get the next available lien prefix
const getNextLienPrefix = (values: Record<string, string>): string => {
  const lienPrefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(lien\d+)\./);
    if (match) {
      lienPrefixes.add(match[1]);
    }
  });
  
  let nextNum = 1;
  while (lienPrefixes.has(`lien${nextNum}`)) {
    nextNum++;
  }
  return `lien${nextNum}`;
};

export const LienSectionContent: React.FC<LienSectionContentProps> = ({
  values,
  onValueChange,
  disabled = false,
  propertyOptions = [],
  onBack,
}) => {
  const [activeSubSection, setActiveSubSection] = useState<LienSubSection>('liens');
  const [selectedLienPrefix, setSelectedLienPrefix] = useState<string>('lien1');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLien, setEditingLien] = useState<LienData | null>(null);
  
  // Check if we're in detail view
  const isDetailView = ['lien_details', 'notes'].includes(activeSubSection);
  
  // Extract liens from values
  const liens = extractLiensFromValues(values);

  // Get the selected lien for detail view
  const selectedLien = useMemo(() => {
    return liens.find(l => l.id === selectedLienPrefix) || {
      id: selectedLienPrefix,
      property: '',
      priority: '',
      holder: '',
      account: '',
      contact: '',
      phone: '',
      originalBalance: '',
      currentBalance: '',
      regularPayment: '',
      lastChecked: '',
      note: '',
    };
  }, [liens, selectedLienPrefix]);

  // Get the selected lien name for detail view header
  const selectedLienName = useMemo(() => {
    if (selectedLien.holder) {
      return selectedLien.holder;
    }
    return `Lien ${selectedLienPrefix.replace('lien', '')}`;
  }, [selectedLien, selectedLienPrefix]);

  // Handle adding a new lien
  const handleAddLien = useCallback(() => {
    setEditingLien(null);
    setModalOpen(true);
  }, []);

  // Handle editing a lien
  const handleEditLien = useCallback((lien: LienData) => {
    setEditingLien(lien);
    setModalOpen(true);
  }, []);

  // Handle row click - navigate to lien details
  const handleRowClick = useCallback((lien: LienData) => {
    setSelectedLienPrefix(lien.id);
    setActiveSubSection('lien_details');
  }, []);

  // Handle back navigation
  const handleBackToTable = useCallback(() => {
    setActiveSubSection('liens');
  }, []);

  // Handle saving lien from modal
  const handleSaveLien = useCallback((lienData: LienData) => {
    const prefix = editingLien ? editingLien.id : getNextLienPrefix(values);
    
    // Save all lien fields
    onValueChange(`${prefix}.property`, lienData.property);
    onValueChange(`${prefix}.priority`, lienData.priority);
    onValueChange(`${prefix}.holder`, lienData.holder);
    onValueChange(`${prefix}.account`, lienData.account);
    onValueChange(`${prefix}.contact`, lienData.contact);
    onValueChange(`${prefix}.phone`, lienData.phone);
    onValueChange(`${prefix}.original_balance`, lienData.originalBalance);
    onValueChange(`${prefix}.current_balance`, lienData.currentBalance);
    onValueChange(`${prefix}.regular_payment`, lienData.regularPayment);
    onValueChange(`${prefix}.last_checked`, lienData.lastChecked);
    onValueChange(`${prefix}.note`, lienData.note);
    
    setModalOpen(false);
  }, [editingLien, values, onValueChange]);

  // Handle lien field change in detail view
  const handleLienFieldChange = useCallback((field: keyof LienData, value: string) => {
    const fieldKeyMap: Record<keyof LienData, string> = {
      id: 'id',
      property: 'property',
      priority: 'priority',
      holder: 'holder',
      account: 'account',
      contact: 'contact',
      phone: 'phone',
      originalBalance: 'original_balance',
      currentBalance: 'current_balance',
      regularPayment: 'regular_payment',
      lastChecked: 'last_checked',
      note: 'note',
    };
    const dbField = fieldKeyMap[field];
    if (dbField && dbField !== 'id') {
      onValueChange(`${selectedLienPrefix}.${dbField}`, value);
    }
  }, [selectedLienPrefix, onValueChange]);

  // Handle note change
  const handleNoteChange = useCallback((value: string) => {
    onValueChange(`${selectedLienPrefix}.note`, value);
  }, [selectedLienPrefix, onValueChange]);

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'liens':
        return (
          <LiensTableView
            liens={liens}
            onAddLien={handleAddLien}
            onEditLien={handleEditLien}
            onRowClick={handleRowClick}
            onBack={onBack}
            disabled={disabled}
          />
        );
      case 'lien_details':
        return (
          <LienDetailForm
            lien={selectedLien}
            onChange={handleLienFieldChange}
            disabled={disabled}
            propertyOptions={propertyOptions}
          />
        );
      case 'notes':
        return (
          <LienNoteForm
            value={selectedLien.note}
            onChange={handleNoteChange}
            disabled={disabled}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
        {/* Full-width breadcrumb header when in detail view */}
        {isDetailView && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTable}
              className="gap-1 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-medium text-foreground">
              {selectedLienName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          {/* Sub-navigation tabs on the left - only shown in detail view */}
          <LienSubNavigation
            activeSubSection={activeSubSection}
            onSubSectionChange={setActiveSubSection}
            isDetailView={isDetailView}
          />

          {/* Sub-section content on the right */}
          <div className="flex-1 min-w-0 overflow-auto">
            {renderSubSectionContent()}
          </div>
        </div>
      </div>

      {/* Add/Edit Lien Modal */}
      <LienModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        lien={editingLien}
        onSave={handleSaveLien}
        isEdit={!!editingLien}
        propertyOptions={propertyOptions}
      />
    </>
  );
};

export default LienSectionContent;
