import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is installed as a PWA (Added to Home Screen)
 * Uses display-mode: standalone media query to detect PWA mode
 */
const useIsPwaInstalled = () => {
    const [isPwaInstalled, setIsPwaInstalled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkPwaMode = () => {
            // Check if running in standalone mode (PWA)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

            // iOS Safari specific check
            const isIOSStandalone = window.navigator.standalone === true;

            // Android TWA check
            const isTWA = document.referrer.includes('android-app://');

            return isStandalone || isIOSStandalone || isTWA;
        };

        setIsPwaInstalled(checkPwaMode());
        setIsLoading(false);

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleChange = (e) => {
            setIsPwaInstalled(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return { isPwaInstalled, isLoading };
};

export default useIsPwaInstalled;
