/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// PWA virtual module types
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    onNeedRefresh?(): void
    onOfflineReady?(): void
    onRegistered?(registration: ServiceWorkerRegistration | undefined): void
    onRegisterError?(error: Error): void
  }

  export function registerSW(options: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}
