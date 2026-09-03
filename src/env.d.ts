/// <reference types="astro/client" />

declare module '*?raw' {
  const content: string;
  export default content;
}

declare namespace App {
  interface Locals {
    user: { id: string; email?: string } | null;
    authMode: 'supabase' | 'local-development' | 'unconfigured';
  }
}
