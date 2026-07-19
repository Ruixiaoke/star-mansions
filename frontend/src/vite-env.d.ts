/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 基地址，见 .env.example */
  readonly VITE_API_BASE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
