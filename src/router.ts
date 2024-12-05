export class Router {
    private routes: Map<string, () => Promise<void>>;
    private container: HTMLElement;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container with id ${containerId} not found`);
        this.container = container;
        this.routes = new Map();
        this.initializeRouter();
    }

    private initializeRouter(): void {
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.matches('a.nav-link')) {
                e.preventDefault();
                const href = target.getAttribute('href');
                if (href) this.navigate(href);
            }
        });

        // Add navigation menu
        const nav = document.createElement('nav');
        nav.className = 'nav-container';
        nav.innerHTML = `
            <ul class="nav-list">
                <li><a href="/" class="nav-link">Player Search</a></li>
                <li><a href="/squad" class="nav-link">Squad Builder</a></li>
                <li><a href="/stats" class="nav-link">Stats</a></li>
            </ul>
        `;
        this.container.insertAdjacentElement('beforebegin', nav);
    }

    public addRoute(path: string, handler: () => Promise<void>): void {
        this.routes.set(path, handler);
    }

    public async navigate(path: string): Promise<void> {
        window.history.pushState(null, '', path);
        await this.handleRoute();
    }

    public async handleRoute(): Promise<void> {
        const path = window.location.pathname;
        const handler = this.routes.get(path);
        
        if (handler) {
            await handler();
        } else {
            // Default to player search if route not found
            const defaultHandler = this.routes.get('/');
            if (defaultHandler) await defaultHandler();
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === path);
        });
    }

    public getContainer(): HTMLElement {
        return this.container;
    }

    public async initialize(): Promise<void> {
        await this.handleRoute();
    }
} 