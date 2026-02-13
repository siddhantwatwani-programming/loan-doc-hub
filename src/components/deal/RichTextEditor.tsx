import React, { useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Indent, Outdent, Undo, Redo, MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem,
} from '@/components/ui/menubar';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}> = ({ onClick, icon, title }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    className="h-7 w-7"
    onClick={onClick}
    title={title}
  >
    {icon}
  </Button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value, onChange, placeholder = 'Enter note content...', minHeight = '200px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      {/* Menu bar */}
      <div className="border-b border-input px-1 py-0.5">
        <Menubar className="border-none bg-transparent shadow-none p-0 h-auto">
          {['Edit', 'View', 'Insert', 'Format'].map(menu => (
            <MenubarMenu key={menu}>
              <MenubarTrigger className="text-xs px-2 py-0.5 h-auto cursor-pointer text-muted-foreground hover:text-foreground">
                {menu}
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem className="text-xs">{menu} option 1</MenubarItem>
                <MenubarItem className="text-xs">{menu} option 2</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-input flex-wrap">
        <ToolbarButton onClick={() => exec('undo')} icon={<Undo className="h-4 w-4" />} title="Undo" />
        <ToolbarButton onClick={() => exec('redo')} icon={<Redo className="h-4 w-4" />} title="Redo" />

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolbarButton onClick={() => exec('bold')} icon={<Bold className="h-4 w-4" />} title="Bold" />
        <ToolbarButton onClick={() => exec('italic')} icon={<Italic className="h-4 w-4" />} title="Italic" />
        <ToolbarButton onClick={() => exec('underline')} icon={<Underline className="h-4 w-4" />} title="Underline" />
        <ToolbarButton onClick={() => exec('strikeThrough')} icon={<Strikethrough className="h-4 w-4" />} title="Strikethrough" />

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolbarButton onClick={() => exec('justifyLeft')} icon={<AlignLeft className="h-4 w-4" />} title="Align Left" />
        <ToolbarButton onClick={() => exec('justifyCenter')} icon={<AlignCenter className="h-4 w-4" />} title="Align Center" />
        <ToolbarButton onClick={() => exec('justifyRight')} icon={<AlignRight className="h-4 w-4" />} title="Align Right" />
        <ToolbarButton onClick={() => exec('justifyFull')} icon={<AlignJustify className="h-4 w-4" />} title="Justify" />

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolbarButton onClick={() => exec('indent')} icon={<Indent className="h-4 w-4" />} title="Indent" />
        <ToolbarButton onClick={() => exec('outdent')} icon={<Outdent className="h-4 w-4" />} title="Outdent" />

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolbarButton onClick={() => {}} icon={<MoreHorizontal className="h-4 w-4" />} title="More" />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        className="px-3 py-2 text-sm outline-none overflow-y-auto"
        style={{ minHeight }}
        onInput={handleInput}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
