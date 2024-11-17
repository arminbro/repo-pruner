import * as core from '@actions/core';
import * as github from '@actions/github';
import type { InactiveBranch } from './types';

export async function createOrUpdateSummaryIssue(
  owner: string,
  repo: string,
  inactiveBranches: InactiveBranch[]
): Promise<void> {
  // Get token
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set.');
  }

  const octokit = github.getOctokit(token);
  const issueTitle = 'Repo Pruner: Inactive Branches Summary';

  // Check if an existing summary issue is open
  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: 'Repo Pruner Summary',
  });

  let keepBranches = new Set<string>();
  let deletedBranches = new Set<string>();

  if (issues.length > 0) {
    // Retrieve the existing issue details
    const issueNumber = issues[0].number;
    const { data: existingIssue } = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    const existingBody = existingIssue.body || '';
    const lines = existingBody.split('\n');

    // Parse existing issue body to track previously marked branches
    for (const line of lines) {
      // Match checkboxes for "Kept" and "Deleted"
      if (line.includes('- [x] **Kept**')) {
        const branchName = line.match(/`([^`]+)`/)?.[1];
        if (branchName) keepBranches.add(branchName);
      }

      if (line.includes('- [x] **Deleted**')) {
        const branchName = line.match(/`([^`]+)`/)?.[1];
        if (branchName) deletedBranches.add(branchName);
      }
    }

    core.info(`Found existing summary issue #${issueNumber} with previous branch statuses.`);
  }

  // Create the new issue body with updated format
  const issueBody = `### Inactive Branches

This is a list of branches that have been inactive based on the specified threshold. Please check off either "Kept" or "Deleted" for each branch to inform your team about your decision.

${inactiveBranches
  .map(
    (branch) => `
#### Branch: \`${branch.name}\`
_Last Commit Date:_ ${branch.lastCommitDate}  
_Creator:_ @${branch.creator}  
_Status:_ ${branch.isMerged ? 'Merged' : 'Unmerged'}  
_Pull Request:_ ${
      branch.prNumber ? `[PR #${branch.prNumber}](https://github.com/${owner}/${repo}/pull/${branch.prNumber})` : 'None'
    }

- [${keepBranches.has(branch.name) ? 'x' : ' '}] **Kept**
- [${deletedBranches.has(branch.name) ? 'x' : ' '}] **Deleted**
`
  )
  .join('\n---\n')}
`;

  if (issues.length > 0) {
    // Update existing summary issue
    const issueNumber = issues[0].number;

    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      body: issueBody,
    });

    core.info(`Updated existing summary issue #${issueNumber}`);
    return;
  }

  // Create a new summary issue
  await octokit.rest.issues.create({
    owner,
    repo,
    title: issueTitle,
    body: issueBody,
    labels: ['Repo Pruner Summary'],
  });

  core.info('Created a new summary issue for inactive branches.');
}
