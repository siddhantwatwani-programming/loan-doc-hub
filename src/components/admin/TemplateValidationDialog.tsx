import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Tag,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FoundTag {
  tag: string;
  tagName: string;
  tagType: 'merge_tag' | 'label' | 'f_code' | 'curly_brace';
  fieldKey: string | null;
  mapped: boolean;
  suggestions?: string[];
}

interface ValidationResult {
  valid: boolean;
  totalTagsFound: number;
  mappedTags: FoundTag[];
  unmappedTags: FoundTag[];
  warnings: string[];
  errors: string[];
  summary: {
    mergeTagCount: number;
    labelCount: number;
    fCodeCount: number;
    curlyBraceCount: number;
    mappedCount: number;
    unmappedCount: number;
  };
}

interface TemplateValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  validating: boolean;
  result: ValidationResult | null;
  onCreateMapping?: (tagName: string, fieldKey: string) => void;
  onRevalidate?: () => void;
  creatingMapping?: boolean;
}

const tagTypeLabels: Record<string, { label: string; color: string }> = {
  merge_tag: { label: 'Merge Tag', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  label: { label: 'Label', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  f_code: { label: 'F-Code', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  curly_brace: { label: 'Curly Brace', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
};

interface UnmappedTagItemProps {
  tag: FoundTag;
  onCreateMapping?: (tagName: string, fieldKey: string) => void;
  creatingMapping?: boolean;
}

const UnmappedTagItem: React.FC<UnmappedTagItemProps> = ({ 
  tag, 
  onCreateMapping, 
  creatingMapping 
}) => {
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    onCreateMapping?.(tag.tagName, suggestion);
  };

  const handleCustomMapping = () => {
    if (customFieldKey.trim()) {
      onCreateMapping?.(tag.tagName, customFieldKey.trim());
      setCustomFieldKey('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="p-3 border border-destructive/30 rounded-lg bg-destructive/5">
      <div className="flex items-center gap-3">
        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {tag.tagName}
            </code>
            <Badge className={cn("text-xs", tagTypeLabels[tag.tagType]?.color)}>
              {tagTypeLabels[tag.tagType]?.label}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Suggestions */}
      {tag.suggestions && tag.suggestions.length > 0 && (
        <div className="mt-2 ml-7">
          <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <Lightbulb className="h-3 w-3" />
            Suggestions:
          </div>
          <div className="flex flex-wrap gap-1">
            {tag.suggestions.map((suggestion, si) => (
              <Button
                key={si}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={creatingMapping}
              >
                {creatingMapping ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                {suggestion}
              </Button>
            ))}
            {!showCustomInput && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowCustomInput(true)}
                disabled={creatingMapping}
              >
                <Plus className="h-3 w-3 mr-1" />
                Custom
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Custom field key input */}
      {(showCustomInput || (!tag.suggestions || tag.suggestions.length === 0)) && (
        <div className="mt-2 ml-7">
          <div className="text-xs text-muted-foreground mb-1">
            Enter custom field key:
          </div>
          <div className="flex gap-2">
            <Input
              value={customFieldKey}
              onChange={(e) => setCustomFieldKey(e.target.value)}
              placeholder="e.g., borrower.name"
              className="h-7 text-xs flex-1"
              disabled={creatingMapping}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomMapping();
                }
              }}
            />
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleCustomMapping}
              disabled={!customFieldKey.trim() || creatingMapping}
            >
              {creatingMapping ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Map'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const TemplateValidationDialog: React.FC<TemplateValidationDialogProps> = ({
  open,
  onOpenChange,
  templateName,
  validating,
  result,
  onCreateMapping,
  onRevalidate,
  creatingMapping,
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  const getStatusIcon = () => {
    if (validating) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
    if (!result) return null;
    if (result.valid) return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    if (result.errors.length > 0) return <XCircle className="h-6 w-6 text-destructive" />;
    return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (validating) return 'Validating template...';
    if (!result) return '';
    if (result.valid) return 'All tags are properly mapped';
    if (result.unmappedTags.length > 0) return `${result.unmappedTags.length} unmapped tag(s) found`;
    return 'Validation completed with warnings';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Validation: {templateName}
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </span>
            {result && !validating && onRevalidate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRevalidate}
                disabled={validating || creatingMapping}
                className="h-7"
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", validating && "animate-spin")} />
                Refresh
              </Button>
            )}
          </DialogDescription>
        </DialogHeader>

        {validating ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Parsing template and checking merge tags...</p>
            </div>
          </div>
        ) : result ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">
                Summary
              </TabsTrigger>
              <TabsTrigger value="mapped" className="flex items-center gap-1">
                Mapped
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {result.mappedTags.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unmapped" className="flex items-center gap-1">
                Unmapped
                {result.unmappedTags.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {result.unmappedTags.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 mt-4">
              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{result.totalTagsFound}</div>
                    <div className="text-sm text-muted-foreground">Total Tags</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.summary.mappedCount}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Mapped</div>
                  </div>
                  <div className={cn(
                    "rounded-lg p-4 text-center",
                    result.summary.unmappedCount > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-muted/50"
                  )}>
                    <div className={cn(
                      "text-2xl font-bold",
                      result.summary.unmappedCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                    )}>
                      {result.summary.unmappedCount}
                    </div>
                    <div className={cn(
                      "text-sm",
                      result.summary.unmappedCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                    )}>
                      Unmapped
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{result.warnings.length}</div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </div>
                </div>

                {/* Tag Type Breakdown */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Tag Types Found</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.summary.mergeTagCount > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Merge Tags: {result.summary.mergeTagCount}
                      </Badge>
                    )}
                    {result.summary.curlyBraceCount > 0 && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Curly Brace: {result.summary.curlyBraceCount}
                      </Badge>
                    )}
                    {result.summary.fCodeCount > 0 && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                        F-Codes: {result.summary.fCodeCount}
                      </Badge>
                    )}
                    {result.summary.labelCount > 0 && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        Labels: {result.summary.labelCount}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-4">
                    <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Errors
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div className="border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                      {result.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.valid && result.warnings.length === 0 && (
                  <div className="border border-green-500/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Template is ready for document generation
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      All merge tags are properly mapped to field dictionary entries.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="mapped" className="flex-1 mt-4 min-h-0">
              <ScrollArea className="h-[400px] pr-4">
                {result.mappedTags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No mapped tags found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.mappedTags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                      >
                        <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded truncate">
                              {tag.tagName}
                            </code>
                            <Badge className={cn("text-xs", tagTypeLabels[tag.tagType]?.color)}>
                              {tagTypeLabels[tag.tagType]?.label}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <code className="text-sm font-mono text-green-600 dark:text-green-400 truncate max-w-[200px]">
                          {tag.fieldKey}
                        </code>
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unmapped" className="flex-1 mt-4 min-h-0">
              <ScrollArea className="h-[400px] pr-4">
                {result.unmappedTags.length === 0 ? (
                  <div className="text-center py-8 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                    All tags are mapped!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.unmappedTags.map((tag, index) => (
                      <UnmappedTagItem
                        key={index}
                        tag={tag}
                        onCreateMapping={onCreateMapping}
                        creatingMapping={creatingMapping}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : null}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateValidationDialog;
