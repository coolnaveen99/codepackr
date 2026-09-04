/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_GOOGLE_SCRIPT_URL?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
