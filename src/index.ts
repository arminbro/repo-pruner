import * as core from '@actions/core';
import * as github from '@actions/github';
import { createOrUpdateSummaryIssue } from './utils/issueUtils';
import { calculateThresholdDate } from './utils/dateUtils';
import type { InactiveBranch } from './types';

async function run() {
  try {
    // Get token
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error(`GITHUB_TOKEN environment variable is not set.`);
    }

    // Get input values
    const inactiveDays = parseInt(core.getInput('inactive_days') || '30');

    if (isNaN(inactiveDays) || inactiveDays <= 0) {
      throw new Error('The inactive_days input must be a valid positive number.');
    }

    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    // Calculate the threshold date for inactivity
    const thresholdDate = calculateThresholdDate(inactiveDays);

    // List branches in the repository
    const { data: branches } = await octokit.rest.repos.listBranches({
      owner,
      repo,
    });

    if (branches.length === 0) {
      core.info('No branches found in the repository.');
      return;
    }

    let inactiveBranches: InactiveBranch[] = [];

    for (const branch of branches) {
      core.info(`Processing branch: ${branch.name}`);

      // Skip protected branches
      if (branch.protected) {
        core.info(`Skipping protected branch: ${branch.name}`);
        continue;
      }

      // Get the last commit date
      let commitData;

      try {
        const { data } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: branch.commit.sha,
        });

        commitData = data;
      } catch (error) {
        core.warning(`Failed to fetch commit data for branch ${branch.name}: ${error}`);
        continue;
      }

      const lastCommitDate = commitData.commit.author?.date ? new Date(commitData.commit.author.date) : null;

      if (!lastCommitDate) {
        core.info(`Skipping branch due to missing last commit date: ${branch.name}`);
        continue;
      }

      // Check if the branch is inactive
      if (lastCommitDate < thresholdDate) {
        const creator = commitData.author?.login || 'unknown';
        let isMerged = false;
        let prNumber = undefined;

        // Check if this branch has any PRs
        try {
          const { data: prs } = await octokit.rest.pulls.list({
            owner,
            repo,
            head: `${owner}:${branch.name}`,
          });

          if (prs.length > 0) {
            prNumber = prs[0].number; // Take the first PR associated with the branch

            try {
              const { data: prDetails } = await octokit.rest.pulls.get({
                owner,
                repo,
                pull_number: prNumber,
              });

              isMerged = prDetails.merged; // Check if the PR was merged
            } catch (error) {
              core.warning(`Failed to fetch PR details for PR #${prNumber}: ${error}`);
            }
          }
        } catch (error) {
          core.warning(`Failed to list PRs for branch ${branch.name}: ${error}`);
        }

        // Add branch to inactive list with relevant details
        inactiveBranches.push({
          name: branch.name,
          lastCommitDate: lastCommitDate.toLocaleDateString(),
          creator,
          isMerged,
          prNumber: isMerged ? prNumber : undefined,
        });

        core.info(`Added branch to inactive list: ${branch.name}`);
      }
    }

    if (inactiveBranches.length > 0) {
      await createOrUpdateSummaryIssue(owner, repo, inactiveBranches, inactiveDays);
      return;
    }

    core.info('No inactive branches found.');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed with error: ${error.message}`);
      return;
    }

    core.setFailed('Action failed with an unknown error');
  }
}

run();
