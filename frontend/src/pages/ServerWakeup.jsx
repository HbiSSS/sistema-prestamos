import { useState, useEffect } from 'react';
import { onServerWakeup } from '../services/api.js';

const ServerWakeup = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        onServerWakeup(setVisible);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50
                        bg-yellow-50 border border-yellow-300 rounded-lg shadow-lg
                        px-6 py-3 flex items-center gap-3 animate-fade-in">
            {/* Spinner */}
            <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <div>
                <p className="text-yellow-800 font-medium text-sm">
                    Despertando servidor...
                </p>
                <p className="text-yellow-600 text-xs">
                    La primera conexión puede tardar ~30 segundos
                </p>
            </div>
        </div>
    );
};

export default ServerWakeup;