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

  // Construct the issue body
  const tableHeader = `
| Branch | Last Commit Date | Creator | Status     | Pull Request |
|--------|------------------|---------|------------|--------------|`;

  const tableRows = inactiveBranches.map((branch) => {
    const status = branch.isMerged ? 'Merged' : 'Unmerged';
    const prLink = branch.prNumber
      ? `[PR #${branch.prNumber}](https://github.com/${owner}/${repo}/pull/${branch.prNumber})`
      : 'None';

    return `| ${branch.name} | ${branch.lastCommitDate} | @${branch.creator} | ${status} | ${prLink} |`;
  });

  const issueBody = `### Inactive Branches

This is a list of branches that have been inactive based on the specified threshold.

${tableHeader}
${tableRows.join('\n')}`;

  // Check if an existing summary issue is open
  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: 'Repo Pruner Summary',
  });

  if (issues.length > 0) {
    // Update the existing issue
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
