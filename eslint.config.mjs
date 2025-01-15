import js from '@eslint/js'

export default [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                require: 'readonly',
                module: 'readonly',
                __dirname: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                console: 'readonly',
                exports: 'readonly',
                setInterval: 'readonly'
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            curly: 'error',
            'prefer-const': 'error',
            eqeqeq: 'error'
        }
    }
]
