# Add React Component

Create a new React component following project conventions.

## Location
Place in appropriate directory:
- `web-portal/src/components/` - Shared UI components
- `web-portal/src/pages/` - Page-level components
- `desktop-app/src/components/` - Desktop app components

## Requirements
- Functional component with TypeScript
- Props interface defined
- Proper hook usage
- CSS module or styled-components for styling
- Export as named export

## Template
```tsx
import React from 'react'
import styles from './ComponentName.module.css'

interface ComponentNameProps {
  // Define props
}

export const ComponentName: React.FC<ComponentNameProps> = ({ ...props }) => {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  )
}
```

Please specify:
1. Component name
2. Props needed
3. State requirements
4. Parent component context
5. Any API integrations
