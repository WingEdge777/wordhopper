export {};

declare global {
  interface Window {
    __wordhopper_jump?: () => void;
    __wordhopper_key?: (key: string) => void;
    __wordhopper_togglePause?: () => void;
    __wordhopper_showLeaderboard?: (tab?: 'daily' | 'chill' | 'easy' | 'medium' | 'hard') => void;
    __wordhopper_closeLeaderboard?: () => void;
    __wordhopper_setGameInputEnabled?: (enabled: boolean) => void;
  }
}
