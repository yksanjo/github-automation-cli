#!/usr/bin/env node

/**
 * GitHub Automation CLI
 * Automate common GitHub tasks
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

const commands = [
  {
    name: 'Update Repository Descriptions',
    value: 'update-descriptions',
    description: 'Auto-generate descriptions for repos without them'
  },
  {
    name: 'List All Repositories',
    value: 'list-repos',
    description: 'List all repositories for a user'
  },
  {
    name: 'Find Repos Without Descriptions',
    value: 'find-missing',
    description: 'Find repositories missing descriptions'
  },
  {
    name: 'Get Repository Stats',
    value: 'stats',
    description: 'Get statistics for all repositories'
  },
  {
    name: 'Exit',
    value: 'exit'
  }
];

const descriptionPatterns = {
  'scraper': 'Web scraping tool for extracting data',
  'api': 'REST API service with Node.js',
  'cli': 'Command-line tool for productivity',
  'dashboard': 'Web dashboard with React',
  'agent': 'AI agent framework',
  'mcp': 'Model Context Protocol server',
  'security': 'Security scanning and detection',
  'monitor': 'Monitoring and alerting system',
  'tracker': 'Tracking and analytics tool',
  'generator': 'Code/data generation tool',
  'analyzer': 'Analysis and reporting',
  'manager': 'Management system',
  'client': 'Client SDK and libraries',
  'server': 'Backend server',
  'web': 'Web application',
  'mobile': 'Mobile application',
  'vscode': 'VS Code extension',
};

function generateDescription(repoName) {
  const name = repoName.toLowerCase();
  for (const [keyword, desc] of Object.entries(descriptionPatterns)) {
    if (name.includes(keyword)) return desc;
  }
  return null;
}

async function getAllRepos(username) {
  const repos = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const cursorArg = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      user(login: "${username}") {
        repositories(first: 100${cursorArg}, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            description
            url
            isPrivate
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }`;

    try {
      const result = JSON.parse(
        execSync(`gh api graphql -f query='${query}'`, { encoding: 'utf8' })
      );
      const { nodes, pageInfo } = result.data.user.repositories;
      repos.push(...nodes);
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    } catch (e) {
      break;
    }
  }
  return repos;
}

async function updateDescriptions() {
  console.log(chalk.blue('\n📝 Updating repository descriptions...\n'));
  
  const username = 'yksanjo';
  const repos = await getAllRepos(username);
  
  const missing = repos.filter(r => !r.description);
  console.log(`Found ${missing.length} repos without descriptions\n`);
  
  let updated = 0;
  for (const repo of missing) {
    const desc = generateDescription(repo.name);
    if (desc) {
      try {
        execSync(`gh repo edit ${username}/${repo.name} --description "${desc}"`, {
          encoding: 'utf8'
        });
        console.log(chalk.green(`✓ Updated: ${repo.name}`));
        updated++;
      } catch (e) {
        console.log(chalk.red(`✗ Failed: ${repo.name}`));
      }
    } else {
      console.log(chalk.yellow(`⚠ No pattern: ${repo.name}`));
    }
  }
  
  console.log(chalk.green(`\n✅ Updated ${updated} repositories!`));
}

async function listRepos() {
  console.log(chalk.blue('\n📋 Listing repositories...\n'));
  
  const username = 'yksanjo';
  const repos = await getAllRepos(username);
  
  repos.forEach(repo => {
    const desc = repo.description || '(No description)';
    const badge = repo.isPrivate ? '🔒' : '🌐';
    console.log(`${badge} ${repo.name}: ${desc}`);
  });
  
  console.log(chalk.blue(`\nTotal: ${repos.length} repositories`));
}

async function findMissing() {
  console.log(chalk.blue('\n🔍 Finding repos without descriptions...\n'));
  
  const username = 'yksanjo';
  const repos = await getAllRepos(username);
  
  const missing = repos.filter(r => !r.description);
  
  if (missing.length === 0) {
    console.log(chalk.green('✅ All repositories have descriptions!'));
  } else {
    console.log(chalk.yellow(`Found ${missing.length} repos without descriptions:\n`));
    missing.forEach(r => console.log(`  - ${r.name}`));
  }
}

async function getStats() {
  console.log(chalk.blue('\n📊 Repository Statistics...\n'));
  
  const username = 'yksanjo';
  const repos = await getAllRepos(username);
  
  const total = repos.length;
  const withDesc = repos.filter(r => r.description).length;
  const withoutDesc = total - withDesc;
  const private = repos.filter(r => r.isPrivate).length;
  const public = total - private;
  
  console.log(`Total Repositories: ${total}`);
  console.log(`Public: ${public} | Private: ${private}`);
  console.log(`With Description: ${withDesc} | Without: ${withoutDesc}`);
}

async function main() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🤖 GitHub Automation CLI v1.0.0                         ║
║                                                               ║
║     Automate your GitHub workflows                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `));

  const { command } = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Select a command:',
      choices: commands
    }
  ]);

  switch (command) {
    case 'update-descriptions':
      await updateDescriptions();
      break;
    case 'list-repos':
      await listRepos();
      break;
    case 'find-missing':
      await findMissing();
      break;
    case 'stats':
      await getStats();
      break;
    case 'exit':
      console.log(chalk.yellow('Goodbye! 👋'));
      process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, updateDescriptions };
