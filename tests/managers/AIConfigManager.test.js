/**
 * AIConfigManager 单元测试
 * 测试配置管理器的加载、保存、验证等功能
 */

// 内联类定义，用于测试
class AIConfigManager {
    constructor() {
        this.config = null;
        this.storageKey = 'ai-config';
    }

    loadConfig() {
        const ls = global.localStorage || localStorage;
        const saved = ls.getItem(this.storageKey);
        if (saved) {
            try {
                this.config = JSON.parse(saved);
                return this.config;
            } catch (e) {
                console.error('Failed to parse AI config:', e);
            }
        }
        return this.getDefaultConfig();
    }

    saveConfig(config) {
        const encoded = { ...config };
        if (encoded.apiKey) {
            encoded.apiKey = btoa(encoded.apiKey);
        }
        const ls = global.localStorage || localStorage;
        ls.setItem(this.storageKey, JSON.stringify(encoded));
        this.config = encoded;
        return true;
    }

    validateConfig(config) {
        const errors = [];

        if (!config.apiKey || config.apiKey.trim() === '') {
            errors.push('API Key is required');
        }

        if (!['openai', 'anthropic', 'custom'].includes(config.provider)) {
            errors.push('Invalid provider');
        }

        if (config.provider === 'custom' && !config.endpoint) {
            errors.push('Custom endpoint is required');
        }

        if (config.temperature !== undefined &&
            (config.temperature < 0 || config.temperature > 2)) {
            errors.push('Temperature must be between 0 and 2');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    hasConfig() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    getApiKey() {
        const config = this.loadConfig();
        if (config.apiKey) {
            try {
                return atob(config.apiKey);
            } catch (e) {
                return '';
            }
        }
        return '';
    }

    getDefaultConfig() {
        return {
            provider: 'openai',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 2000
        };
    }

    getDefaultModels(provider) {
        const models = {
            openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
            anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            custom: []
        };
        return models[provider] || [];
    }
}

describe('AIConfigManager', () => {
    let manager;
    let localStorageMock;

    beforeEach(() => {
        // Mock localStorage
        localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        global.localStorage = localStorageMock;

        // Mock btoa and atob
        global.btoa = jest.fn(str => Buffer.from(str, 'binary').toString('base64'));
        global.atob = jest.fn(str => Buffer.from(str, 'base64').toString('binary'));

        // Real localStorage for some tests
        global.realLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };

        manager = new AIConfigManager();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loadConfig', () => {
        it('should load config from localStorage when exists', () => {
            const mockConfig = {
                provider: 'openai',
                apiKey: 'test-key',
                model: 'gpt-4'
            };
            global.localStorage.setItem('ai-config', JSON.stringify(mockConfig));

            const config = manager.loadConfig();

            expect(config.provider).toBe('openai');
            expect(config.apiKey).toBe('test-key');
            expect(config.model).toBe('gpt-4');
        });

        it('should return default config when localStorage is empty', () => {
            global.localStorage.removeItem('ai-config');

            const config = manager.loadConfig();

            expect(config.provider).toBe('openai');
            expect(config.model).toBe('gpt-3.5-turbo');
            expect(config.temperature).toBe(0.7);
            expect(config.maxTokens).toBe(2000);
        });

        it('should handle invalid JSON in localStorage', () => {
            global.localStorage.setItem('ai-config', 'invalid json');

            const config = manager.loadConfig();

            expect(config.provider).toBe('openai');
            expect(config.model).toBe('gpt-3.5-turbo');
        });
    });

    describe('saveConfig', () => {
        it('should save config to localStorage', () => {
            const config = {
                provider: 'anthropic',
                apiKey: 'test-key',
                model: 'claude-3'
            };

            manager.saveConfig(config);

            const saved = global.localStorage.getItem('ai-config');
            expect(saved).toContain('anthropic');
        });

        it('should encode API key with Base64', () => {
            const config = {
                provider: 'openai',
                apiKey: 'secret-key',
                model: 'gpt-4'
            };

            manager.saveConfig(config);

            const saved = global.localStorage.getItem('ai-config');
            const savedData = JSON.parse(saved);
            expect(savedData.apiKey).not.toBe('secret-key');
            expect(savedData.apiKey).toBe(btoa('secret-key'));
        });

        it('should return true on success', () => {
            const config = {
                provider: 'openai',
                apiKey: 'test-key',
                model: 'gpt-4'
            };

            const result = manager.saveConfig(config);
            expect(result).toBe(true);
        });
    });

    describe('validateConfig', () => {
        it('should return true for valid OpenAI config', () => {
            const config = {
                provider: 'openai',
                apiKey: 'sk-test123',
                model: 'gpt-4'
            };

            const result = manager.validateConfig(config);
            expect(result.valid).toBe(true);
        });

        it('should return true for valid Anthropic config', () => {
            const config = {
                provider: 'anthropic',
                apiKey: 'sk-ant-test',
                model: 'claude-3'
            };

            const result = manager.validateConfig(config);
            expect(result.valid).toBe(true);
        });

        it('should return true for valid custom endpoint config', () => {
            const config = {
                provider: 'custom',
                apiKey: 'custom-key',
                model: 'custom-model',
                endpoint: 'https://api.example.com/v1'
            };

            const result = manager.validateConfig(config);
            expect(result.valid).toBe(true);
        });

        it('should return error when API key is missing', () => {
            const config = {
                provider: 'openai',
                model: 'gpt-4'
            };

            const result = manager.validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('API Key is required');
        });

        it('should return error when provider is invalid', () => {
            const config = {
                provider: 'invalid-provider',
                apiKey: 'test-key'
            };

            const result = manager.validateConfig(config);
            expect(result.valid).toBe(false);
        });

        it('should return error when custom endpoint is missing', () => {
            const config = {
                provider: 'custom',
                apiKey: 'test-key'
            };

            const result = manager.validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Custom endpoint is required');
        });

        it('should validate temperature range', () => {
            const config = {
                provider: 'openai',
                apiKey: 'test-key',
                temperature: 2.5
            };

            const result = manager.validateConfig(config);
            expect(result.valid).toBe(false);
        });
    });

    describe('hasConfig', () => {
        it('should return true when config exists', () => {
            localStorage.setItem('ai-config', JSON.stringify({
                provider: 'openai',
                apiKey: 'test-key'
            }));

            expect(manager.hasConfig()).toBe(true);
        });

        it('should return false when config does not exist', () => {
            localStorage.removeItem('ai-config');
            expect(manager.hasConfig()).toBe(false);
        });
    });

    describe('getApiKey', () => {
        it('should decode Base64 encoded API key', () => {
            localStorage.setItem('ai-config', JSON.stringify({
                apiKey: Buffer.from('secret-key').toString('base64')
            }));

            const key = manager.getApiKey();
            expect(key).toBe('secret-key');
        });

        it('should return empty string when no config', () => {
            localStorage.removeItem('ai-config');
            const key = manager.getApiKey();
            expect(key).toBe('');
        });
    });

    describe('getDefaultModels', () => {
        it('should return default models for OpenAI', () => {
            const models = manager.getDefaultModels('openai');
            expect(models).toContain('gpt-4');
            expect(models).toContain('gpt-3.5-turbo');
        });

        it('should return default models for Anthropic', () => {
            const models = manager.getDefaultModels('anthropic');
            expect(models).toContain('claude-3-opus');
            expect(models).toContain('claude-3-sonnet');
        });

        it('should return empty array for unknown provider', () => {
            const models = manager.getDefaultModels('unknown');
            expect(models).toEqual([]);
        });
    });
});
