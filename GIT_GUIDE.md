# Git Version Control Guide for Beginners

## What is Git?

Git is a version control system that tracks changes to your files over time. Think of it like a time machine for your code - you can save snapshots (called "commits") and go back to any point if something breaks.

## Basic Concepts

- **Repository (repo)**: Your project folder with version control
- **Commit**: A snapshot of your code at a specific point in time
- **Branch**: A separate line of development (like a parallel universe)
- **Remote**: A copy of your repository stored online (like GitHub)

## Step-by-Step: Getting Started

### 1. Initialize Git Repository

```bash
git init
```

This creates a `.git` folder that tracks all changes.

### 2. Check Status

```bash
git status
```

Shows which files are new, modified, or ready to be committed.

### 3. Stage Files (Prepare for Commit)

```bash
# Stage all files
git add .

# Or stage specific files
git add index.html game.js
```

### 4. Create a Commit (Save Snapshot)

```bash
git commit -m "Initial commit: Space shooter game"
```

The `-m` flag adds a message describing what changed.

### 5. View History

```bash
git log
```

Shows all your commits with messages and dates.

### 6. See What Changed

```bash
git diff
```

Shows differences between your working files and the last commit.

## Common Workflow

1. **Make changes** to your files
2. **Check status**: `git status`
3. **Stage changes**: `git add .`
4. **Commit**: `git commit -m "Description of changes"`
5. **Repeat!**

## Example Workflow

```bash
# After making changes to game.js
git status                    # See what changed
git add game.js              # Stage the file
git commit -m "Add sound effects to game"  # Save the snapshot
git log                      # View your commit history
```

## Useful Commands

- `git status` - See what's changed
- `git add .` - Stage all changes
- `git commit -m "message"` - Save a snapshot
- `git log` - View commit history
- `git diff` - See what changed
- `git checkout -- filename` - Undo changes to a file (before committing)
- `git reset HEAD~1` - Undo last commit (keeps your changes)

## Best Practices

1. **Commit often**: Save your work frequently with meaningful messages
2. **Write clear messages**: "Add sound effects" is better than "stuff"
3. **Commit related changes together**: Don't mix unrelated changes
4. **Test before committing**: Make sure your code works!

## Example Commit Messages

✅ Good:
- "Add sound effects for enemy shots and player hits"
- "Fix game freeze when enemy is destroyed"
- "Implement progressive difficulty system"

❌ Bad:
- "update"
- "fix"
- "changes"

## Next Steps (Optional)

### Connect to GitHub (Online Backup)

1. Create account at github.com
2. Create a new repository
3. Connect it:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

### Create Branches (Advanced)

```bash
git branch feature-name    # Create new branch
git checkout feature-name # Switch to branch
git merge feature-name    # Merge branch back
```

## Quick Reference Card

```
git init                  # Start version control
git status               # What changed?
git add .                # Stage all changes
git commit -m "msg"      # Save snapshot
git log                  # View history
git diff                 # See changes
```

