---
applyTo: "**/*.ts"
excludeAgent: ["copilot-review"]
---

# TypeScript Instructions

## Strict Mode
- Enable all strict checks
- No implicit any
- Strict null checks enabled

## Type Definitions
```typescript
// Interfaces for object shapes
interface User {
  id: string
  name: string
  email: string
}

// Types for unions, intersections, primitives
type Status = 'pending' | 'active' | 'completed'
type ID = string | number

// Generics for reusable types
type Response<T> = {
  data: T
  error?: string
}
```

## Function Typing
```typescript
// Explicit return types
function processData(input: string): ProcessedData {
  // ...
}

// Arrow functions with types
const handler = async (req: Request): Promise<Response> => {
  // ...
}
```

## Avoid
- `any` type (use `unknown` if needed)
- Type assertions without validation
- Non-null assertions (`!`) without checks

## Prefer
- Type inference where clear
- Discriminated unions for state
- Readonly for immutable data
- Template literal types for strings
