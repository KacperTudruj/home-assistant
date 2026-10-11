import { initCommentary } from './js/modules/commentary.js';
import { loadApps, renderAppNav } from './js/modules/navigation.js';
import { initCarLog, initFullFuelHistory } from './js/modules/car-log.js';
import { initAgd } from './js/modules/agd.js';

document.addEventListener("DOMContentLoaded", () => {
    const pageType = document.body.dataset.page;

    // Initialize common features
    initCommentary();
    renderAppNav();

    // Page specific initialization
    if (pageType === "home") {
        loadApps();
    } else if (pageType === "app") {
        initCarLog();
    } else if (pageType === "car-fuel-history") {
        initFullFuelHistory();
    } else if (pageType === "car-analytics") {
        import('./js/modules/car-analytics.js').then(module => module.initCarAnalytics()).catch(() => {
            document.getElementById('analytics-status').textContent = 'Nie udało się załadować strony. Odśwież widok.';
        });
    } else if (pageType === "smart-agd") {
        initAgd();
    }
});
