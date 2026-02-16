// Dashboard feature module
// Views: DashboardView
// Components: TimelineSection, EisenhowerMatrix, CommitmentsSection
// Composables: useDashboard
export { default as DashboardView } from './views/DashboardView.vue'
export { default as TimelineSection } from './components/TimelineSection.vue'
export { default as EisenhowerMatrix } from './components/EisenhowerMatrix.vue'
export { default as CommitmentsSection } from './components/CommitmentsSection.vue'
export { useDashboard } from './composables/useDashboard'
export { dashboardApi } from './services/dashboard.api'
export type * from './types/dashboard.types'
