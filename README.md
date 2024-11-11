# Repo Pruner

**Repo Pruner** is a GitHub Action designed to help maintain clean and organized repositories by monitoring inactive branches. This tool scans for branches that have been inactive for a specified duration (based on the last commit date) and automatically opens a pull request for each branch. The branch creator is assigned as the reviewer, allowing them to either merge their work or close the PR and delete the branch, ensuring your repository remains streamlined and clutter-free.

## Features
- Scans branches for inactivity based on the number of days since the last commit.
- Ignores protected branches and branches that already have an open pull request.
- Creates a pull request for each inactive branch targeting the base branch.
- Assigns the branch creator as the reviewer for the PR.
- Provides a customizable inactivity threshold and base branch.

## Usage
To use **Repo Pruner**, add it to your workflow file:

```yaml
name: "Run Repo Pruner"
on:
  schedule:
    - cron: '0 0 * * 0' # Example: You can run it weekly
  workflow_dispatch:

jobs:
  repo-pruner:
    runs-on: ubuntu-latest
    steps:
      - name: Run Repo Pruner
        uses: arminbro/repo-pruner@v1.0.2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          inactive_days: 30
          base_branch: main
```

## Inputs

| Name           | Description                                                                                  | Required | Default     |
|----------------|----------------------------------------------------------------------------------------------|----------|-------------|
| `inactive_days`| Number of days since the last commit before a branch is considered inactive.                 | No       | `30`        |
| `base_branch`  | The base branch used for the pull request.                                                   | No       | `main`      |

## Environment Variables
- **`GITHUB_TOKEN`** (required): GitHub token for authentication.

## Permissions
Ensure your GitHub Actions workflow has sufficient permissions to:
- **Read branches**
- **Create pull requests**
- **Assign reviewers**

Using `${{ secrets.GITHUB_TOKEN }}` should provide the necessary permissions for most standard uses.

## Contributing
Contributions, issues, and feature requests are welcome! Feel free to open a pull request or issue in the repository.

## License
This project is licensed under the MIT License. See the [LICENSE](https://github.com/arminbro/repo-pruner/blob/master/LICENSE) file for more details.
