import type { FileSystem } from '../types';

export const initialFileSystem: FileSystem = {
  'root': {
    id: 'root',
    name: 'Workspace',
    type: 'folder',
    children: ['welcome']
  },
  'welcome': {
    id: 'welcome',
    name: 'Welcome.md',
    type: 'file',
    content: `# Welcome to Markdown Workspace :rocket:

This application renders GitHub-Flavored Markdown notes as clean HTML with fine-grained in-place editing and Virtual DOM security.

### Interactive Hover Editing :pencil2:
Hover over any paragraph, table, list item, or heading. An **Edit** pencil button will appear on the top-right. Click it to turn only that specific block into an editable field with Save and Cancel buttons.

### Active Interactive Checklists :ballot_box_with_check:
Checkboxes in Markdown lists are fully interactive. Clicking a check box immediately updates the underlying Markdown source code.

- [x] Select a file from the explorer on the left :white_check_mark:
- [ ] Hover over this item and click Edit to modify it :pencil2:
- [ ] Click the checkbox to toggle its state :tada:

### Feature Summary
| Feature | Supported | Description |
| :--- | :---: | :--- |
| GitHub Tables | :white_check_mark: | Formatted responsive tables with clean borders |
| Emoji Shortcodes | :tada: | Converts codes like \`:dog:\` into :dog: and \`:fire:\` into :fire: |
| Syntax Highlighting | :sparkles: | Powered by Prism and React Syntax Highlighter |
| Safe Virtual DOM | :shield: | XSS-resilient parsing via the Unified.js ecosystem |`
  }
};
