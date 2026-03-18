# Deployment Guide: GitHub + Netlify

## Step 1: Create GitHub Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository settings:
   - **Name**: `space-shooter-game` (or any name you like)
   - **Description**: "A space shooter game built with Phaser.js"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/space-shooter-game.git

# Rename branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Step 3: Connect to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your repository (`space-shooter-game`)
6. Configure build settings:
   - **Build command**: Leave empty (no build needed)
   - **Publish directory**: `.` (root directory)
7. Click **"Deploy site"**

## Step 4: Wait for Deployment

Netlify will:
- Clone your repository
- Deploy your site
- Give you a URL like `https://your-site-name.netlify.app`

## Step 5: Custom Domain (Optional)

You can customize your site name in:
- Site settings → **"Change site name"**
- Or add a custom domain in **"Domain settings"**

## Automatic Deployments

Every time you push to GitHub, Netlify will automatically redeploy your site!

```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Netlify automatically deploys! 🚀
```

## Troubleshooting

- **Build fails**: Check that `index.html` is in the root directory
- **404 errors**: Make sure `netlify.toml` is present
- **Images not loading**: Verify image paths are relative (like `images/player.png`)


