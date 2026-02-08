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
    } else if (pageType === "smart-agd") {
        initAgd();
    }
});
