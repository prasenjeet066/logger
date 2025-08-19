// Temporary ambient declarations to unblock builds. Replace with proper imports/types later.
declare module "next-auth/next" {
  export function getServerSession(...args: any[]): Promise<any>
}

declare module "next-auth/jwt" {
  export function getToken(...args: any[]): Promise<any>
}
