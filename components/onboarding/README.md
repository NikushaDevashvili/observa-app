# Onboarding Components

React components for the Observa onboarding experience, matching the dashboard visual language.

## Components

### OnboardingBanner
Dismissible banner showing current progress and next step.

**Usage:**
```tsx
import { OnboardingBanner } from "@/components/onboarding";

<OnboardingBanner />
```

Automatically fetches session token from localStorage and displays when onboarding is incomplete.

### OnboardingChecklist
Full checklist of onboarding tasks with progress tracking.

**Usage:**
```tsx
import { OnboardingChecklist } from "@/components/onboarding";

<OnboardingChecklist compact={false} />
```

### NextStepsCard
Card showing recommended next steps with action buttons.

**Usage:**
```tsx
import { NextStepsCard } from "@/components/onboarding";

<NextStepsCard />
```

### OnboardingProgress
Standalone progress indicator.

**Usage:**
```tsx
import { OnboardingProgress } from "@/components/onboarding";

<OnboardingProgress showLabel={true} size="lg" />
```

## API Routes

All components use Next.js API routes that proxy to the backend:

- `/api/onboarding/banner`
- `/api/onboarding/checklist`
- `/api/onboarding/progress`
- `/api/onboarding/next-steps`
- `/api/onboarding/preferences`
- `/api/onboarding/tasks/[taskKey]/complete`
- `/api/onboarding/tasks/[taskKey]/skip`

## Styling

All components use Tailwind CSS matching the dashboard:
- Colors: `blue-600`, `green-500`, `gray-50`, `gray-900`
- Spacing: Standard Tailwind scale
- Border radius: `rounded-lg`
- Shadows: `shadow-sm`

## Dependencies

- `lucide-react` - Already installed in the project
- No additional dependencies required


