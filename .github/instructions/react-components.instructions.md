---
applyTo: "**/*.tsx"
---

# React Component Instructions

## Component Structure
- Use functional components exclusively
- Export components as named exports
- Place component logic before JSX return

## Hooks Usage
- useState for local state
- useEffect for side effects (with proper cleanup)
- useCallback for memoized callbacks
- useMemo for expensive computations
- Custom hooks should be prefixed with `use`

## TypeScript
- Define Props interfaces above component
- Use `React.FC<Props>` or explicit return types
- Avoid `any` - use proper typing

## Styling
- Use CSS modules or styled-components
- Avoid inline styles except for dynamic values
- Follow BEM naming convention for class names

## Example Pattern
```tsx
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```
