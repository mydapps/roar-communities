// Placeholder for Tiptap Mention Plugin

import { Editor, Extension, Range } from '@tiptap/react';
import { Plugin, PluginKey, EditorState, Transaction } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';

// Replicating SuggestionItem structure from MentionSuggestionsList.tsx to avoid direct import issues if any
// This should match the SuggestionItem type used in CreatePostModal.tsx and MentionSuggestionsList.tsx
export interface PluginSuggestionItem {
  id: string;
  display: string;
  subDisplay?: string;
  image?: string;
  type: 'user' | 'community';
}

export interface MentionState {
  show: boolean;
  query: string;
  type: 'user' | 'community' | null;
  items: PluginSuggestionItem[]; // Use the replicated/aligned SuggestionItem structure
  loading: boolean;
  position: { top: number; left: number; visible: boolean };
  selectedIndex: number;
  triggerPos: number | null;
  triggerChar?: '@' | '/c/';
  range?: Range; 
  command?: (props: { id: string, type: 'user' | 'community' }) => void; 
  triggerAction?: 'select' | 'close'; 
}

interface MentionPluginProps {
  onStateChange: (state: Partial<MentionState>) => void;
}

const mentionPluginKey = new PluginKey('mentions_plugin_state');

export const getMentionsPlugin = (componentOptions: MentionPluginProps): Extension => {
  return Extension.create<MentionPluginProps> ({
    name: 'mentions',
    addOptions() {
      return {
        ...componentOptions,
      };
    },
    addProseMirrorPlugins() {
      const extensionThis = this;
      return [
        new Plugin({
          key: mentionPluginKey,
          state: {
            init: (): Omit<MentionState, 'items' | 'loading' | 'command'> => ({ // items and loading are managed by React component state primarily
              show: false,
              query: '',
              type: null,
              position: { top: 0, left: 0, visible: false },
              selectedIndex: 0,
              triggerPos: null,
              triggerChar: undefined,
              range: undefined,
              triggerAction: undefined,
            }),
            apply: (tr: Transaction, value: MentionState, oldEditorState: EditorState, newEditorState: EditorState): MentionState => {
              const { selection } = newEditorState;
              const { $from } = selection;
              const textBeforeCursor = newEditorState.doc.textBetween(Math.max(0, $from.pos - 50), $from.pos, '\0', '\0');
              
              let show = false;
              let query = '';
              let type: 'user' | 'community' | null = null;
              let triggerPos: number | null = null;
              let triggerChar: '@' | '/c/' | undefined = undefined;
              let range: Range | undefined = undefined;

              const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\-]+)$/);
              const cMatch = textBeforeCursor.match(/\/c\/([a-zA-Z0-9_\-]+)$/);
              const cTriggerOnlyMatch = textBeforeCursor.match(/\/c\/$/);

              if (atMatch) {
                type = 'user';
                query = atMatch[1];
                triggerPos = $from.pos - query.length - 1;
                triggerChar = '@';
                show = query.length >= 0; 
                range = { from: triggerPos, to: $from.pos };
              } else if (cMatch) {
                type = 'community';
                query = cMatch[1];
                triggerPos = $from.pos - query.length - 3; 
                triggerChar = '/c/';
                show = query.length >= 0;
                range = { from: triggerPos, to: $from.pos };
              } else if (cTriggerOnlyMatch && !cMatch) {
                type = 'community';
                query = '';
                triggerPos = $from.pos - 3;
                triggerChar = '/c/';
                show = true; 
                range = { from: triggerPos, to: $from.pos };
              }

              if (!selection.empty || !show) {
                if (value.show) { 
                  extensionThis.options.onStateChange({ show: false, query: '', type: null, selectedIndex: 0, items: [] });
                }
                return { ...value, show: false, query: '', type: null, selectedIndex: 0, items: value.items || [], loading: value.loading || false }; 
              }

              let newPosition = value.position;
              if (show && extensionThis.editor && triggerPos !== null) {
                const { view } = extensionThis.editor;
                const editorElement = view.dom;

                if (view.dom.isConnected && editorElement) {
                    const editorRect = editorElement.getBoundingClientRect();
                    const anchorPos = newEditorState.selection.anchor; 

                    const safeTriggerPos = Math.min(triggerPos, newEditorState.doc.content.size);
                    const safeAnchorPos = Math.min(anchorPos, newEditorState.doc.content.size);

                    const triggerCoordsViewport = view.coordsAtPos(safeTriggerPos); 
                    const cursorCoordsViewport = view.coordsAtPos(safeAnchorPos);

                    const estimatedListHeight = 220; 
                    const smallOffset = 5; 

                    // Calculate available space relative to the editor box, not the whole viewport directly for this check
                    // This is simplified; true viewport checks for space are complex if editor itself is scrollable
                    // For now, focus on relative positioning within the editor's parent (which is now position:relative)
                    
                    // Top of the cursor line, relative to the editor's parent top edge
                    const cursorLineTopRel = cursorCoordsViewport.top - editorRect.top;
                    // Bottom of the cursor line, relative to the editor's parent top edge
                    const cursorLineBottomRel = cursorCoordsViewport.bottom - editorRect.top;

                    // Check available space inside the editor's relative parent (simplified)
                    // Assuming the parent has enough height, or is scrollable.
                    // More robustly, we'd check against the parent's height and scroll position.
                    const spaceBelowRel = editorElement.clientHeight - cursorLineBottomRel; // Simplified space below within editor area
                    const spaceAboveRel = cursorLineTopRel; // Simplified space above within editor area
                    
                    let topPositionRel: number;

                    if (spaceBelowRel >= estimatedListHeight || spaceBelowRel >= spaceAboveRel) {
                        topPositionRel = cursorLineBottomRel + smallOffset;
                    } else if (spaceAboveRel >= estimatedListHeight) {
                        topPositionRel = cursorLineTopRel - estimatedListHeight - smallOffset;
                    } else {
                         // Fallback: try to fit, prefer below if both are tight but below is better.
                        if (spaceAboveRel > spaceBelowRel && spaceAboveRel > smallOffset*2) { 
                             topPositionRel = cursorLineTopRel - Math.min(estimatedListHeight, spaceAboveRel - smallOffset) - smallOffset;
                        } else {
                            topPositionRel = cursorLineBottomRel + smallOffset;
                        }
                    }
                    
                    // Ensure the list doesn't go above the editor's top edge if placed above
                    if (topPositionRel < 0 && (cursorLineTopRel - estimatedListHeight - smallOffset < 0)) {
                        topPositionRel = smallOffset; // Place it just below the top of the editor area as a fallback
                    }
                    // Further checks could be added to ensure it does not overflow parent boundaries.

                    newPosition = {
                        top: topPositionRel, // This is now relative to the editor's parent
                        left: triggerCoordsViewport.left - editorRect.left, // Relative to editor's parent
                        visible: true,
                    };
                } else {
                    newPosition = { ...value.position, visible: false }; 
                }
              } else if (!show) {
                newPosition = { ...value.position, visible: false }; 
              }

              const newStateFromPlugin: Partial<MentionState> = {
                show,
                query,
                type,
                triggerPos,
                triggerChar,
                range,
                position: newPosition,
                selectedIndex: (value.query !== query || value.type !== type) ? 0 : value.selectedIndex,
              };
              
              const significantChange =
                value.show !== newStateFromPlugin.show ||
                value.query !== newStateFromPlugin.query ||
                value.type !== newStateFromPlugin.type ||
                (newStateFromPlugin.show && JSON.stringify(value.position) !== JSON.stringify(newStateFromPlugin.position)) ||
                (newStateFromPlugin.show && value.selectedIndex !== newStateFromPlugin.selectedIndex);

              if (significantChange) {
                extensionThis.options.onStateChange(newStateFromPlugin);
              }
              return { ...value, ...newStateFromPlugin, items: value.items || [], loading: value.loading || false };
            },
          },
          props: {
            handleKeyDown: (view: EditorView, event: KeyboardEvent): boolean => {
              const pluginState = mentionPluginKey.getState(view.state) as MentionState | undefined;
              if (!pluginState || !pluginState.show) { 
                return false;
              }

              let handled = false;
              if (event.key === 'ArrowUp') {
                extensionThis.options.onStateChange({ selectedIndex: -1, show: true }); 
                handled = true;
              } else if (event.key === 'ArrowDown') {
                extensionThis.options.onStateChange({ selectedIndex: -2, show: true }); 
                handled = true;
              } else if (event.key === 'Enter') {
                event.preventDefault();
                extensionThis.options.onStateChange({ triggerAction: 'select' }); 
                handled = true;
              } else if (event.key === 'Escape') {
                event.preventDefault();
                extensionThis.options.onStateChange({ triggerAction: 'close', show: false, query: '', type: null, selectedIndex: 0, items: [] });
                handled = true;
              }
              
              return handled;
            },
          },
        }),
      ];
    },
  });
}; 