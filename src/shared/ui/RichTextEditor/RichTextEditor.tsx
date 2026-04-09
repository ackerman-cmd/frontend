import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Button, Tooltip, Divider } from 'antd';
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined,
  OrderedListOutlined, UnorderedListOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  LinkOutlined, StrikethroughOutlined, UndoOutlined, RedoOutlined,
} from '@ant-design/icons';

import './RichTextEditor.css';

interface ToolbarButtonProps {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function ToolbarBtn({ title, active, disabled, onClick, icon }: ToolbarButtonProps) {
  return (
    <Tooltip title={title}>
      <Button
        type={active ? 'primary' : 'text'}
        size="small"
        icon={icon}
        disabled={disabled}
        onClick={onClick}
        style={{ borderRadius: 4, padding: '0 6px', height: 26, minWidth: 26 }}
      />
    </Tooltip>
  );
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Введите текст...',
  minHeight = 160,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextStyle,
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
    ],
    content: value ?? '',
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
  });

  const handleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL ссылки:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className="rich-editor-wrap"
      style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden', opacity: disabled ? 0.6 : 1 }}
    >
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '6px 10px', borderBottom: '1px solid #f0f0f0',
        background: '#fafafa', flexWrap: 'wrap',
      }}>
        <ToolbarBtn title="Жирный (Ctrl+B)" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()} icon={<BoldOutlined />} />
        <ToolbarBtn title="Курсив (Ctrl+I)" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()} icon={<ItalicOutlined />} />
        <ToolbarBtn title="Подчёркнутый (Ctrl+U)" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineOutlined />} />
        <ToolbarBtn title="Зачёркнутый" active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()} icon={<StrikethroughOutlined />} />

        <Divider type="vertical" style={{ margin: '0 2px', height: 18 }} />

        <ToolbarBtn title="Маркированный список" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<UnorderedListOutlined />} />
        <ToolbarBtn title="Нумерованный список" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<OrderedListOutlined />} />

        <Divider type="vertical" style={{ margin: '0 2px', height: 18 }} />

        <ToolbarBtn title="По левому краю" active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeftOutlined />} />
        <ToolbarBtn title="По центру" active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenterOutlined />} />
        <ToolbarBtn title="По правому краю" active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRightOutlined />} />

        <Divider type="vertical" style={{ margin: '0 2px', height: 18 }} />

        <ToolbarBtn title="Ссылка" active={editor.isActive('link')}
          onClick={handleLink} icon={<LinkOutlined />} />

        <Divider type="vertical" style={{ margin: '0 2px', height: 18 }} />

        <ToolbarBtn title="Отменить (Ctrl+Z)" disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()} icon={<UndoOutlined />} />
        <ToolbarBtn title="Повторить (Ctrl+Y)" disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()} icon={<RedoOutlined />} />
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        style={{ minHeight, padding: '10px 14px', cursor: disabled ? 'not-allowed' : 'text' }}
      />
    </div>
  );
}
