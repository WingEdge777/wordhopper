export {};

declare global {
  interface Window {
    __wordhopper_jump?: () => void;
    __wordhopper_key?: (key: string) => void;
    __wordhopper_togglePause?: () => void;
  }
}
