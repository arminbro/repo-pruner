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

  // Check if an existing summary issue is open
  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: 'Repo Pruner Summary',
  });

  let keepBranches = new Set<string>();
  let deleteBranches = new Set<string>();

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
      if (line.startsWith('#### Branch: ')) {
        const start = line.indexOf('[') + 1; // Find the opening square bracket
        const end = line.indexOf(']'); // Find the closing square bracket
        const branchName = line.substring(start, end); // Extract the branch name

        if (line.includes('- [x] **Keep**')) {
          keepBranches.add(branchName);
        } else if (line.includes('- [x] **Delete**')) {
          deleteBranches.add(branchName);
        }
      }
    }

    core.info(`Found existing summary issue #${issueNumber} with previous branch statuses.`);
  }

  // Create the new issue body with updated format
  const issueBody = `### Inactive Branches

This is a list of branches that have been inactive beyond the specified threshold. If you are the creator of a branch, please review it and delete it if it is no longer needed. After reviewing and taking action, return to this page and check off either "Keep" or "Delete" for each branch to notify your team of your decision.

This list was automatically generated using [Repo Pruner](https://github.com/marketplace/actions/repo-pruner).
\n---\n

${inactiveBranches
  .map(
    (branch) => `
#### Branch: [${branch.name}](https://github.com/${owner}/${repo}/branches/all?query=${branch.name})
_Last Commit Date:_ ${branch.lastCommitDate}  
_Creator:_ ${branch.creator === 'unknown' ? 'unknown' : `@${branch.creator}`}  
_Status:_ ${branch.isMerged ? 'Merged' : 'Unmerged'}  
_Pull Request:_ ${
      branch.prNumber ? `[PR #${branch.prNumber}](https://github.com/${owner}/${repo}/pull/${branch.prNumber})` : 'None'
    }

\n
**Did you keep or delete this branch?**
- [${keepBranches.has(branch.name) ? 'x' : ' '}] **Keep**
- [${deleteBranches.has(branch.name) ? 'x' : ' '}] **Delete**
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
    title: 'Repo Pruner: Inactive Branches Summary',
    body: issueBody,
    labels: ['Repo Pruner Summary'],
  });

  core.info('Created a new summary issue for inactive branches.');
}
