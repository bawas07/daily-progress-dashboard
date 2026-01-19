# Frontend Vue 3 + Vite Conventions

## Core Stack

### Vue Router: v4
- Clean Composition API (`useRouter`, `useRoute`, `useNavigate`)
- Nested routes with `<RouterView>` pattern
- Navigation guards for authentication
- Lazy-loaded routes for code splitting

### Tailwind CSS: v3.4
- Rock solid, widely adopted
- Great documentation and ecosystem
- v4 exists but v3.4 is more battle-tested
- Use CSS variables for theming (shadcn pattern)

### Recommended Dependencies
```json
{
  "vue": "^3.5",
  "vue-router": "^4.4",
  "pinia": "^2.2",
  "@vueuse/core": "^11.0",
  "tailwindcss": "^3.4",
  "axios": "^1.7",
  "lucide-vue-next": "^0.460",
  "zod": "^3.24"
}
```

---

## Tech Stack Summary

- **Vue 3** with Composition API and `<script setup>`
- **Vite** for fast development and optimized builds
- **Pinia** for global state management
- **Vue Router v4** for navigation
- **VueUse** for composables and form handling
- **Axios** for API communication
- **Lucide Vue Next** for consistent iconography
- **Zod** for validation
- **Tailwind CSS** with variable themes (shadcn pattern)

---

## Project Structure

```
src/
├── features/              # Business logic modules (feature-first organization)
│   ├── auth/             # Authentication (login, register, password reset)
│   │   ├── components/   # Feature-specific components
│   │   ├── composables/  # Feature-specific composables
│   │   ├── services/     # Feature-specific API calls
│   │   ├── types/        # Feature-specific TypeScript types
│   │   └── views/        # Feature views/pages
│   ├── dashboard/        # Main dashboard views
│   ├── progress/         # Progress items management
│   ├── commitments/      # Commitments management
│   ├── timeline/         # Timeline events management
│   ├── history/          # History views and analytics
│   └── settings/         # User preferences and account
├── shared/               # Reusable components and utilities
│   ├── components/       # Shared UI components
│   │   └── ui/          # UI primitives (Button, Input, Card, etc.)
│   ├── composables/      # Shared Vue composables
│   ├── services/         # Shared API services
│   ├── stores/           # Pinia stores
│   ├── types/            # Shared TypeScript interfaces
│   ├── utils/            # Helper functions and constants
│   └── constants/        # App-wide constants
├── router/               # Vue Router configuration
├── styles/               # Global CSS and Tailwind config
├── App.vue               # Root Vue component
└── main.ts               # Application entry point
```

---

## Development Guidelines

### Component Patterns

1. **Composition API Only** - Use `<script setup>` with `ref`, `computed`, `watch`
2. **Feature Isolation** - Keep feature-specific code within feature folders
3. **Shared Components** - Place reusable UI in `/shared/components`
4. **UI Primitives** - Mimic shadcn design pattern for base components
5. **Composables First** - Extract reusable logic into composables

### State Management

- **Local State**: `ref` or `computed` for component-specific state
- **Global State**: Pinia stores in `/shared/stores`
- **Reactive State**: `reactive` for complex local state objects
- **Form State**: VueUse `useForm` for all forms
- **Server State**: Direct API calls with loading/error handling

### Pinia Store Pattern

```typescript
// shared/stores/authStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/shared/types';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value);

  // Actions
  function setUser(userData: User) {
    user.value = userData;
  }

  function setToken(tokenData: string) {
    token.value = tokenData;
  }

  function logout() {
    user.value = null;
    token.value = null;
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    setUser,
    setToken,
    logout
  };
});
```

---

## Theming (shadcn Pattern)

### CSS Variables in `index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode values */
  }
}
```

### Tailwind Config

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
```

---

## API Integration

### Axios Configuration

```typescript
// shared/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/shared/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth headers if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Pattern

```typescript
// shared/services/userService.ts
import api from './api';
import type { User, CreateUserRequest } from '@/shared/types';

class UserService {
  async getUsers(): Promise<User[]> {
    const { data } = await api.get('/users');
    return data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const { data } = await api.post('/users', userData);
    return data;
  }
}

export const userService = Object.freeze(new UserService());
```

---

## Composables Pattern

### Creating Reusable Composables

```typescript
// shared/composables/useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);

  const increment = () => {
    count.value++;
  };

  const decrement = () => {
    count.value--;
  };

  const doubleCount = computed(() => count.value * 2);

  return {
    count: readonly(count),
    increment,
    decrement,
    doubleCount
  };
}
```

### Using Composables in Components

```vue
<script setup lang="ts">
import { useCounter } from '@/shared/composables/useCounter';

const { count, increment, decrement, doubleCount } = useCounter(10);
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
  </div>
</template>
```

---

## Code Standards

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserForm.vue`, `Button.vue` |
| Composables | camelCase with 'use' prefix | `useAuth.ts`, `useCounter.ts` |
| Services | camelCase | `userService.ts`, `api.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS` |
| Stores | camelCase with 'use' prefix | `useAuthStore.ts` |
| Types | PascalCase | `User`, `CreateUserRequest` |
| Utils | camelCase | `formatDate.ts`, `validate.ts` |

### Form Handling with VueUse

```vue
<script setup lang="ts">
import { useForm } from '@vueuse/core';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: userSchema,
  initialValues: {
    name: '',
    email: '',
  },
});

const [name, nameAttrs] = defineField('name');
const [email, emailAttrs] = defineField('email');

const onSubmit = handleSubmit(async (data) => {
  // Handle submission
});
</script>

<template>
  <form @submit="onSubmit">
    <div>
      <input v-model="name" v-bind="nameAttrs" />
      <span v-if="errors.name">{{ errors.name }}</span>
    </div>
    <div>
      <input v-model="email" v-bind="emailAttrs" />
      <span v-if="errors.email">{{ errors.email }}</span>
    </div>
    <button :disabled="isSubmitting">Submit</button>
  </form>
</template>
```

### Error Handling

```typescript
// Consistent error handling pattern
try {
  const result = await userService.createUser(data);
  // Handle success
} catch (error) {
  // Show user-friendly message
  console.error('User creation failed:', error);
}
```

---

## Component Examples

### Button Component

```vue
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
  <button
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>
```

### Authentication Flow

- JWT tokens stored in httpOnly cookies
- Automatic token refresh on 401 responses
- Protected routes using navigation guards

### Route Protection

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/shared/stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/features/dashboard/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/views/LoginView.vue'),
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;
```

---

## File Extensions

- **Components**: `.vue`
- **Composables/Types/Utils**: `.ts`
- **Config files**: `.ts`, `.js`, `.json`
- **Styles**: `.css`, `.scss`
