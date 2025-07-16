// Frontend Configuration
// Environment-aware API URL configuration

class Config {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.getConfig();
    }

    detectEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        
        // Check if we're running in development
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.includes('localhost') ||
            port === '5173' || // Vite
            port === '3000' || // React/Next.js
            port === '8080'    // Vue
        ) {
            return 'development';
        }
        
        return 'production';
    }

    getConfig() {
        const configs = {
            development: {
                API_BASE_URL: 'http://localhost/POMODOROapp/backend/api/',
                API_ENDPOINTS: {
                    LOGIN: 'login.php',
                    REGISTER: 'register.php',
                    RESET_PASSWORD: 'reset_password.php',
                    CREATE_SESSION: 'create_session.php',
                    ANALYTICS: 'analytics.php',
                    FRIEND_ACTIONS: 'friend_actions.php'
                },
                DEBUG: true,
                ENABLE_CONSOLE_LOGS: true
            },
            production: {
                // Update these URLs for your production environment
                API_BASE_URL: 'https://yourdomain.com/api/',
                API_ENDPOINTS: {
                    LOGIN: 'login.php',
                    REGISTER: 'register.php', 
                    RESET_PASSWORD: 'reset_password.php',
                    CREATE_SESSION: 'create_session.php',
                    ANALYTICS: 'analytics.php',
                    FRIEND_ACTIONS: 'friend_actions.php'
                },
                DEBUG: false,
                ENABLE_CONSOLE_LOGS: false
            }
        };

        return configs[this.environment];
    }

    // Helper methods
    getApiUrl(endpoint = '') {
        if (endpoint && this.config.API_ENDPOINTS[endpoint.toUpperCase()]) {
            return this.config.API_BASE_URL + this.config.API_ENDPOINTS[endpoint.toUpperCase()];
        }
        return this.config.API_BASE_URL + endpoint;
    }

    isProduction() {
        return this.environment === 'production';
    }

    isDevelopment() {
        return this.environment === 'development';
    }

    isDebugEnabled() {
        return this.config.DEBUG;
    }

    log(...args) {
        if (this.config.ENABLE_CONSOLE_LOGS) {
            console.log('[Config]', ...args);
        }
    }

    // API Helper methods
    async makeApiRequest(endpoint, options = {}) {
        const url = this.getApiUrl(endpoint);
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for CORS
        };

        const requestOptions = { ...defaultOptions, ...options };

        if (this.isDebugEnabled()) {
            this.log('Making API request:', { url, options: requestOptions });
        }

        try {
            const response = await fetch(url, requestOptions);
            
            if (this.isDebugEnabled()) {
                this.log('API response:', { status: response.status, url });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (this.isDebugEnabled()) {
                console.error('API request failed:', { url, error });
            }
            throw error;
        }
    }

    // Quick API methods
    async login(email, password) {
        return this.makeApiRequest('LOGIN', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.makeApiRequest('REGISTER', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async createSession(sessionData) {
        return this.makeApiRequest('CREATE_SESSION', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }

    async getAnalytics() {
        return this.makeApiRequest('ANALYTICS');
    }
}

// Create global config instance
window.appConfig = new Config();

// Log current configuration in development
if (window.appConfig.isDevelopment()) {
    console.log('🚀 App Configuration Loaded:', {
        environment: window.appConfig.environment,
        apiBaseUrl: window.appConfig.config.API_BASE_URL,
        debug: window.appConfig.config.DEBUG
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
} 