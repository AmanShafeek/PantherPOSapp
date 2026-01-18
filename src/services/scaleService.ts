export const scaleService = {
    /**
     * Reads weight from the configured scale via serial port
     */
    readWeight: async (): Promise<{ success: boolean; weight?: number; error?: string }> => {
        try {
            const result = await window.electronAPI.scaleReadWeight();
            return result;
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
};
