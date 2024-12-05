import { Router } from './router.js';
import { SquadBuilder } from './components/SquadBuilder.js';
import { PlayerSearch } from './components/PlayerSearch.js';
import { StatsTable } from './components/StatsTable.js';
class App {
    constructor() {
        this.router = new Router('app');
        this.initializeRoutes();
        this.initialize();
    }
    async initialize() {
        await this.router.initialize();
    }
    initializeRoutes() {
        // Player Search route (default)
        this.router.addRoute('/', async () => {
            const playerSearch = new PlayerSearch(this.router.getContainer());
        });
        // Squad Builder route
        this.router.addRoute('/squad', async () => {
            const squadBuilder = new SquadBuilder(this.router.getContainer());
            await squadBuilder.initialize();
        });
        // Stats route
        this.router.addRoute('/stats', async () => {
            const statsTable = new StatsTable(this.router.getContainer());
        });
    }
}
// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
//# sourceMappingURL=app.js.map