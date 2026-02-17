<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'
import Input from './Input.vue'
import Card from './Card.vue'

const inputValue = ref('')
const emailValue = ref('')
const passwordValue = ref('')
const disabledValue = ref('')
</script>

<template>
  <div class="p-8 space-y-8">
    <h1 class="text-2xl font-bold text-neutral-900">UI Component Test</h1>

    <!-- Button Tests -->
    <Card variant="default" padding="md">
      <h2 class="text-lg font-semibold mb-4">Buttons</h2>
      <div class="flex flex-wrap gap-4">
        <Button variant="primary" size="sm">Primary Small</Button>
        <Button variant="primary" size="md">Primary Medium</Button>
        <Button variant="primary" size="lg">Primary Large</Button>
        <Button variant="secondary" size="sm">Secondary Small</Button>
        <Button variant="secondary" size="md">Secondary Medium</Button>
        <Button variant="secondary" size="lg">Secondary Large</Button>
        <Button variant="primary" size="md" disabled>Disabled</Button>
      </div>
    </Card>

    <!-- Input Tests -->
    <Card variant="default" padding="md">
      <h2 class="text-lg font-semibold mb-4">Inputs</h2>
      <div class="space-y-4 max-w-md">
        <Input v-model="inputValue" placeholder="Enter text..." />
        <Input v-model="emailValue" type="email" placeholder="Email address" />
        <Input v-model="passwordValue" type="password" placeholder="Password" />
        <Input v-model="disabledValue" placeholder="Disabled input" disabled />
      </div>
    </Card>

    <!-- Card Tests -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card variant="default" padding="sm">
        <h3 class="font-semibold">Default Card (sm)</h3>
        <p class="text-sm text-neutral-600 mt-2">Small padding</p>
      </Card>
      <Card variant="elevated" padding="md">
        <h3 class="font-semibold">Elevated Card (md)</h3>
        <p class="text-sm text-neutral-600 mt-2">Medium padding with shadow</p>
      </Card>
      <Card variant="outlined" padding="lg">
        <h3 class="font-semibold">Outlined Card (lg)</h3>
        <p class="text-sm text-neutral-600 mt-2">Large padding with border</p>
      </Card>
    </div>

    <!-- Responsive Test -->
    <Card variant="default" padding="md">
      <h2 class="text-lg font-semibold mb-4">Responsive Test</h2>
      <p class="text-sm md:text-base lg:text-lg text-neutral-700">
        Resize your browser to see responsive utilities in action.
        This text changes size based on breakpoint.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div class="bg-primary-100 p-4 rounded text-center">1/4 (lg)</div>
        <div class="bg-primary-200 p-4 rounded text-center">2/4 (lg)</div>
        <div class="bg-primary-300 p-4 rounded text-center">3/4 (lg)</div>
        <div class="bg-primary-400 p-4 rounded text-center">4/4 (lg)</div>
      </div>
    </Card>
  </div>
</template>
