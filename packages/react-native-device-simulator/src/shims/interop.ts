/** `module.default` for ES modules, the module itself for CommonJS (react-native-web's cjs build). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function interopDefault(module: any): any {
  return module && typeof module === 'object' && 'default' in module ? module.default : module;
}
