# Repo Pruner

**Repo Pruner** is a GitHub Action designed to help maintain clean and organized repositories by monitoring inactive branches. This tool scans for branches that have been inactive for a specified duration (based on the last commit date) and creates a summary issue listing their status. The issue includes details like the branch name, the last commit date, whether the branch has been merged, and any associated pull requests, allowing your team to review and decide on further actions.

## Features
- Scans branches for inactivity based on the number of days since the last commit.
- Ignores protected branches and lists all others in a summary issue.
- Displays the status of each branch (e.g., merged, unmerged).
- Includes links to associated pull requests or marks branches without PRs as "None."
- Provides a customizable inactivity threshold.
- Allows developers to mark branches as "Handled" or "Keep" via checkboxes for clear communication.

## Usage
To use **Repo Pruner**, add it to your workflow file:

```yaml
name: "Run Repo Pruner"
on:
  schedule:
    - cron: '0 0 1 * *' # Example: Runs once a month - At 00:00 on day-of-month 1.
  workflow_dispatch:

jobs:
  repo-pruner:
    runs-on: ubuntu-latest
    steps:
      - name: Run Repo Pruner
        uses: arminbro/repo-pruner@v1.0.4
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          inactive_days: 30
```

## Inputs

| Name            | Description                                                                                          | Required | Default     |
|-----------------|------------------------------------------------------------------------------------------------------|----------|-------------|
| `inactive_days` | Number of days since the last commit before a branch is considered inactive.                         | No       | `30`        |

## Output Summary
The action generates a GitHub issue summarizing all inactive branches. Each branch is listed with the following details:
- **Branch Name**: The name of the branch.
- **Last Commit Date**: The date of the last commit on the branch.
- **Creator**: The username of the branch creator.
- **Status**: Indicates whether the branch has been merged into another branch or remains unmerged.
- **Pull Request**: A link to the associated pull request (if any) or "None" if no PR exists.
- **Handled or Keep**: Developers can mark a branch as either "Handled" (merged or deleted) or "Keep" (branch should not be deleted).

### Example Issue
```md
### Inactive Branches

This is a list of branches that have been inactive based on the specified threshold. Please check off either "Handled" or "Keep" for each branch.

| Branch  | Last Commit Date  | Creator  | Status  | Pull Request  | Handled  | Keep  |
|---------|-------------------|----------|---------|---------------|----------|-------|
| `feature-1` | 11/01/2024 | @johndoe | Merged | [PR #42](#) | [ ] | [ ] |
| `hotfix-123` | 10/15/2024 | @janedoe | Unmerged | None | [ ] | [ ] |
| `experiment-2` | 10/05/2024 | @janedoe | Unmerged | None | [ ] | [ ] |

## Environment Variables
- **`GITHUB_TOKEN`** (required): GitHub token for authentication.

## Permissions
Ensure your GitHub Actions workflow has sufficient permissions to:
- **Read branches**
- **List pull requests**
- **Create and update issues**

Using `${{ secrets.GITHUB_TOKEN }}` should provide the necessary permissions for most standard uses.

## Contributing
Contributions, issues, and feature requests are welcome! Feel free to open a pull request or issue in the repository.

## License
This project is licensed under the MIT License. See the [LICENSE](https://github.com/arminbro/repo-pruner/blob/master/LICENSE) file for more details.
