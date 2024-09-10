// Utilities
import {defineStore} from 'pinia';

export const useAppStore = defineStore('app', {
    state: () => ({
        cameraAccess: false,
    }),
    actions: {
        setCameraAccess(access) {
            this.cameraAccess = access;
        },
    },
});
