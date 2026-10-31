import publicService from '../deployment/client-service.json';
import {loadEnv} from 'vite';
import {validateBuildConfig} from '../src/lib/config';

const env=loadEnv('production',process.cwd(),['VITE_','NEXT_PUBLIC_']);
env.VITE_SUPABASE_URL ||= publicService.url;env.VITE_SUPABASE_ANON_KEY ||= publicService.publishableKey;env.VITE_BACKEND_MODE ||= publicService.enabled?'supabase':'demo';
const result=validateBuildConfig(env);
for(const issue of result.warnings)console.warn(`[configuration:${issue.code}] ${issue.message}`);
for(const issue of result.errors)console.error(`[configuration:${issue.code}] ${issue.message}`);
if(result.errors.length)process.exitCode=1;
else console.log(`[configuration] ${result.mode} build configuration checked. Values are not displayed; provider connectivity is not verified.`);
