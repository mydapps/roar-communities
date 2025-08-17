import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline'; // Added Underline import
import HardBreak from '@tiptap/extension-hard-break'; // Import HardBreak
// import Image from '@tiptap/extension-image'; // Removed Image extension
// import Placeholder from '@tiptap/extension-placeholder'; 
import { cn } from '@/lib/utils';
import { getMentionsPlugin, MentionState } from './mentionPlugin'; // Import the mention plugin and its types

// Define the interface for the ref methods
export interface RichTextEditorRef {
  insertImage: (url: string) => void;
}

interface RichTextEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string; 
  className?: string;
  onEditorCreated?: (editor: Editor) => void; // Added callback for editor instance
  onPastedFile?: (file: File) => void; // Prop definition was missing here
  mentionPluginOptions?: { // Define the new prop type
    onStateChange: (state: Partial<MentionState>) => void;
    // Potentially other options needed by the plugin
  };
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder,
  className,
  onEditorCreated, 
  onPastedFile,
  mentionPluginOptions // Use the new prop
}) => {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        // paragraph: {}, // Keep paragraph enabled for Shift+Enter (default behavior)
        hardBreak: false, // Disable StarterKit's default hardBreak to use our custom one below
      }),
      Underline, // Added Underline extension
      HardBreak.extend({ // Custom HardBreak to make Enter key insert <br>
        addKeyboardShortcuts() {
          return {
            'Enter': () => this.editor.commands.setHardBreak(),
            // Shift+Enter should still create a new paragraph due to the Paragraph extension from StarterKit
          };
        },
      }),
      // Image.configure({ ... }) // Removed Image extension config
      // Add the mention plugin if options are provided
      ...(mentionPluginOptions ? [getMentionsPlugin({
          onStateChange: mentionPluginOptions.onStateChange,
          // Pass the editor instance to the plugin so it can use editor.view.coordsAtPos etc.
          // This creates a bit of a chicken-and-egg problem if plugin is initialized before editor instance
          // is fully available. Tiptap's built-in Suggestion utility handles this better.
          // For now, we will pass it and the plugin needs to be mindful of when 'editor' is available.
          // A better way: the plugin could access the editor via this.editor in its lifecycle hooks.
      })] : []),
    ],
    content: content, 
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none',
          'focus:outline-none w-full min-h-[150px] md:min-h-[200px] flex-grow p-3 text-base',
          className 
        ),
        'data-placeholder': placeholder || 'What\'s on your mind?', 
      },
      handlePaste: (view, event, slice) => {
        if (!event.clipboardData || !onPastedFile) {
          return false; 
        }
        const items = event.clipboardData.items;
        let imageFile: File | null = null;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              imageFile = file;
              break; 
            }
          }
        }
        if (imageFile) {
          event.preventDefault(); 
          onPastedFile(imageFile); 
          return true; 
        }
        return false; 
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML()); 
    },
  });

  // Pass the editor instance up when it's created
  useEffect(() => {
    if (editor && onEditorCreated) {
      onEditorCreated(editor);
    }
    // Pass editor to mention plugin AFTER editor is created, if options exist
    // This is a workaround for the chicken-and-egg problem mentioned above.
    // The plugin itself needs to be designed to receive/use the editor instance post-initialization if needed this way.
    if (editor && mentionPluginOptions) {
        const mentionPluginInstance = getMentionsPlugin(mentionPluginOptions); // Get instance with proper options
        const plugin = editor.extensionManager.extensions.find(ext => ext.name === mentionPluginInstance.name);
        if (plugin && plugin.options) {
            // This is conceptual: Tiptap plugins don't typically have their options updated this way post-init.
            // The ideal way is for the plugin to access `this.editor` internally when it needs it.
            // Or, the `onStateChange` callback gets the editor state, from which the view and editor can be derived.
            // Let's assume the plugin internally uses `this.editor` or the state passed to `onStateChange` is sufficient.
            // So, no explicit editor passing here for now. The plugin should get it from its own context.
        }
    }

    // Optional: Cleanup or destroy editor instance if needed when component unmounts
    // return () => { editor?.destroy(); }; 
  }, [editor, onEditorCreated, mentionPluginOptions]);

  return (
    <EditorContent editor={editor} />
  );
};

RichTextEditor.displayName = 'RichTextEditor'; 