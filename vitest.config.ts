import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['{plugins,packages}/*/__test__/**/*.test.ts'],
        setupFiles: ['./vitest.setup.ts']
    }
});
