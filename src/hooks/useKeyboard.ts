import { useEffect, useCallback } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;
type KeyMap = Record<string, KeyHandler>;

export function useKeyboard(keyMap: KeyMap) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const handler = keyMap[e.key] || keyMap[e.code]; // Support both 'Enter' and 'KeyA'
            if (handler) {
                // e.preventDefault(); // Don't prevent default globally unless needed, let handler decide
                handler(e);
            }
        },
        [keyMap]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}
