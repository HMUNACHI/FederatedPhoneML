// Diagnostics.ts

import { initializeTf } from './TensorflowHandler';

export async function runDiagnositics() {
    try {
        await initializeTf();
        return true;
    } catch (error) {
        return false;
        throw error;
    }
    }