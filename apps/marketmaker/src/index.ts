import chalk from 'chalk';
import { parseEnv } from './config/env.config';

parseEnv();

console.log(chalk.green('marketmaker idle: no quoting loop yet'));
