import { useState, useCallback } from 'react';

export interface Config {
    paperTradingMode: boolean;
    lotSize: number;
    stopLossPoints: number;
    targetPoints: number;
    maxDailyLoss: number;
    vixThreshold: number;
    confidenceThreshold: number;
    adxThreshold: number;
    minStreak: number;
    repeatProtection: boolean;
}

const SETTINGS_KEY = 'tradebot_config_v1';

export const defaultConfig: Config = {
    paperTradingMode: true,
    lotSize: 65,
    stopLossPoints: 12,
    targetPoints: 25,
    maxDailyLoss: 5000,
    vixThreshold: 18,
    confidenceThreshold: 25,
    adxThreshold: 20,
    minStreak: 2,
    repeatProtection: true,
};

export function useSettings() {
    const [settings, setSettings] = useState<Config>(() => {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (!saved) return defaultConfig;
        try {
            return { ...defaultConfig, ...JSON.parse(saved) };
        } catch (e) {
            return defaultConfig;
        }
    });

    const saveSettings = useCallback((newSettings: Config) => {
        setSettings(newSettings);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    }, []);

    return { settings, saveSettings };
}
