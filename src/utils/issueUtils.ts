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
      // Identify lines that are table rows (start with a "|")
      if (line.startsWith('|')) {
        // Split the line by the pipe character to get individual columns
        const columns = line.split('|').map((col) => col.trim());

        // Ensure there are enough columns to parse (7 columns expected)
        if (columns.length >= 7) {
          // Extract the branch name from the second column (index 1)
          const branchName = columns[1].replace(/`/g, ''); // Remove backticks

          // Check the "Keep" and "Deleted" columns for checkboxes
          const keepChecked = columns[5] === '[x]';
          const deletedChecked = columns[6] === '[x]';

          // Add the branch to the appropriate set
          if (keepChecked) {
            keepBranches.add(branchName);
          }
          if (deletedChecked) {
            deletedBranches.add(branchName);
          }
        }
      }
    }

    core.info(`Found existing summary issue #${issueNumber} with previous branch statuses.`);
  }

  // Create the new issue body in table format with preserved check states
  const tableHeader = `
| Branch | Last Commit Date | Creator | Status | Pull Request | Keep | Deleted |
|--------|------------------|---------|--------|--------------|------|---------|`;

  const tableRows = inactiveBranches.map((branch) => {
    const status = branch.isMerged ? 'Merged' : 'Unmerged';
    const prLink = branch.prNumber
      ? `[PR #${branch.prNumber}](https://github.com/${owner}/${repo}/pull/${branch.prNumber})`
      : 'None';

    return `| \`${branch.name}\` | ${branch.lastCommitDate} | @${branch.creator} | ${status} | ${prLink} | <li>- [${keepBranches.has(branch.name) ? 'x' : ' '}]</li> | <li>- [${deletedBranches.has(branch.name) ? 'x' : ' '}]</li> |`;
  });

  const issueBody = `### Inactive Branches

This is a list of branches that have been inactive based on the specified threshold. Please check off either "Keep" or "Deleted" for each branch.

${tableHeader}
${tableRows.join('\n')}`;

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
