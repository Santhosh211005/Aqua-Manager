
// Reference to vite/client removed as types are missing

/**
 * Fix: Use 'export {}' to make this file a module, then use 'declare global' to augment 
 * the environment. This is the standard way to provide global types in Vite/TypeScript 
 * without causing "Cannot redeclare block-scoped variable" conflicts.
 */
export {};

declare global {
  /**
   * Fix: The property 'env' on the global 'Process' interface must match the expected 
   * type '{ [key: string]: string; }' exactly to resolve "Subsequent property declarations must have the same type".
   * 'process.env.API_KEY' remains accessible as a string through the index signature.
   */
  interface Process {
    env: { [key: string]: string; };
  }
}
