# Repo Pruner

<p align="center">
  <img alt="Repo Pruner" src="https://raw.githubusercontent.com/arminbro/repo-pruner/master/docs/assets/repo-pruner.webp"/>
</p>

**Repo Pruner** is a GitHub Action designed to help maintain clean and organized repositories by monitoring inactive branches. This tool scans for branches that have been inactive for a specified duration and creates a summary issue listing their status. The issue includes details like the branch name, the last commit date, whether the branch has been merged, and any associated pull requests, allowing your team to review and decide on further actions.

## Features
- Scans branches for inactivity based on the number of days since the last commit.
- Ignores protected branches and lists all others in a summary issue.
- Displays the status of each branch (e.g., merged, unmerged).
- Includes links to associated pull requests or marks branches without PRs as "None."
- Provides a customizable inactivity threshold.
- Preserves the history of summary issues by closing the previous summary issue before creating a new one.
- Allows developers to mark branches as **Keep** or **Delete** via checkboxes for clear communication.

## How It Works
When **Repo Pruner** runs, it:
1. **Scans all branches** for inactivity based on the specified threshold.
2. **Checks for an existing summary issue** labeled "Repo Pruner Summary."
3. **Closes the existing summary issue**, preserving it for historical reference.
4. **Creates a new summary issue** with the latest list of inactive branches and updated details.
5. **Posts the new summary issue**, allowing team members to review and take action on inactive branches.

This ensures that the repository stays organized, while past activity is retained for review.

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
        uses: arminbro/repo-pruner@v2.1.19
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          inactive_days: 30
```

## Inputs

| Name            | Description                                                                                          | Required | Default     |
|-----------------|------------------------------------------------------------------------------------------------------|----------|-------------|
| `inactive_days` | Number of days since the last commit before a branch is considered inactive.                         | No       | `30`        |

## Environment Variables
- **`GITHUB_TOKEN`** (required): GitHub token for authentication.

## Permissions
Ensure your GitHub Actions workflow has sufficient permissions to:
- **Read branches**
- **List pull requests**
- **Create and close issues**

Using `${{ secrets.GITHUB_TOKEN }}` should provide the necessary permissions for most standard uses.

## Contributing
Contributions, issues, and feature requests are welcome! Feel free to open a pull request or issue in the repository.

## License
This project is licensed under the MIT License. See the [LICENSE](https://github.com/arminbro/repo-pruner/blob/master/LICENSE) file for more details.
