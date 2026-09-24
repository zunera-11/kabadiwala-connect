// Raw string import of App.js using Vite's ?raw query
// This loads the entire file as a static text string without running JS/JSX module analysis
import rawAppJsCode from '../../App.js?raw';

export async function loadAppJsCode(): Promise<string> {
  return rawAppJsCode;
}
