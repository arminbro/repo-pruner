/**
 * Represents a single inactive branch's details.
 */
export interface InactiveBranch {
  name: string; // The branch name
  lastCommitDate: string; // Formatted date of the last commit
  creator: string; // GitHub username of the branch creator
  isMerged: boolean; // Whether the branch is fully merged into the base branch
  prNumber?: number; // Optional field for the PR number
}

/**
 * General repository information.
 */
export interface RepositoryInfo {
  owner: string; // The repository owner
  repo: string; // The repository name
}
