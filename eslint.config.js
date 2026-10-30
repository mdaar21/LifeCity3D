import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
export default ts.config({ignores:['dist','node_modules','coverage','playwright-report','test-results','public/sw.js']},js.configs.recommended,...ts.configs.recommended,{files:['scripts/**/*.mjs'],languageOptions:{globals:globals.node}},{files:['**/*.{ts,tsx}'],languageOptions:{globals:{...globals.browser,...globals.node}},plugins:{'react-hooks':reactHooks},rules:{'react-hooks/rules-of-hooks':'error','react-hooks/exhaustive-deps':'error','@typescript-eslint/no-explicit-any':'error','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]}});
