/**
 * Web+ Browser Runtime
 * Minimal JavaScript glue for DOM and Web API integration
 * 
 * This file is automatically included when building Web+ applications for the browser.
 * It provides the necessary bridge between WebAssembly and browser APIs.
 */

(function () {
    'use strict';

    if (typeof window === 'undefined') {
        return;
    }

    window.__webplus_elements = [];
    window.__webplus_next_id = 0;

    window.__webplus_promises = [];
    window.__webplus_promise_id = 0;

    window.__webplus_workers = [];
    window.__webplus_worker_id = 0;

    window.__webplus_callbacks = new Map();
    window.__webplus_callback_id = 0;

    window.__webplus = {
        version: '0.1.0',

        init: function () {
            console.log('[Web+] Runtime initialized v' + this.version);
        },

        registerCallback: function (fn) {
            const id = window.__webplus_callback_id++;
            window.__webplus_callbacks.set(id, fn);
            return id;
        },

        invokeCallback: function (id, ...args) {
            const fn = window.__webplus_callbacks.get(id);
            if (fn) {
                fn(...args);
            }
        },

        cleanupElement: function (id) {
            if (window.__webplus_elements[id]) {
                delete window.__webplus_elements[id];
            }
        },

        cleanupPromise: function (id) {
            if (window.__webplus_promises[id]) {
                delete window.__webplus_promises[id];
            }
        },

        cleanupWorker: function (id) {
            const worker = window.__webplus_workers[id];
            if (worker) {
                worker.terminate();
                delete window.__webplus_workers[id];
            }
        },

        logError: function (message) {
            console.error('[Web+ Error]', message);
        },

        logWarn: function (message) {
            console.warn('[Web+ Warning]', message);
        },

        logInfo: function (message) {
            console.log('[Web+ Info]', message);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.__webplus.init();
        });
    } else {
        window.__webplus.init();
    }

    window.addEventListener('beforeunload', function () {
        for (let id = 0; id < window.__webplus_workers.length; id++) {
            window.__webplus.cleanupWorker(id);
        }
    });

})();
