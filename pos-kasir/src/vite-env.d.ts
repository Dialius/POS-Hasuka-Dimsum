/// <reference types="vite/client" />

interface Window {
  __GAS_URL__?: string
  __GAS_API_KEY__?: string
}

interface ImportMetaEnv {
  readonly VITE_API_SECRET_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
