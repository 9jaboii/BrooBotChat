# BrooBot Deployment Guide for AWS Amplify

This guide provides step-by-step instructions for deploying BrooBot to AWS Amplify.

## Prerequisites

- AWS Account with appropriate permissions
- BrooBot codebase (completed)
- Git repository (GitHub, GitLab, or Bitbucket)
- Anthropic API key for Claude

## Deployment Options

### Option 1: Amplify Console (Recommended - No CLI Required)

This is the **recommended approach** since your local machine has CLI issues.

#### Step 1: Prepare Your Code

1. Push your BrooBot code to a Git repository:
   - GitHub (recommended)
   - GitLab
   - Bitbucket
   - AWS CodeCommit

#### Step 2: AWS Amplify Console Setup

1. **Sign in to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to AWS Amplify service

2. **Create New App**
   - Click "New app" → "Host web app"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize AWS Amplify to access your repository

3. **Select Repository**
   - Choose the BrooBot repository
   - Select the main/master branch

4. **Configure Build Settings**

   Amplify will auto-detect your build settings. Verify they match:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

5. **Environment Variables**

   Add the following environment variables in Amplify Console:

   - `VITE_ANTHROPIC_API_KEY` = your_anthropic_api_key
   - `VITE_APP_NAME` = BrooBot
   - `VITE_APP_VERSION` = 1.0.0

6. **Review and Deploy**
   - Review all settings
   - Click "Save and deploy"
   - Wait for deployment to complete (5-10 minutes)

7. **Access Your App**
   - Once deployed, Amplify provides a URL: `https://main.xxxxx.amplifyapp.com`
   - Visit the URL to see your deployed app

#### Step 3: Set Up Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Follow the wizard to:
   - Add your custom domain
   - Configure DNS settings
   - Set up SSL certificate (automatic)

### Option 2: Amplify CLI (If CLI is Working)

If your CLI starts working later, you can use this method:

```bash
# Install Amplify CLI globally
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
cd ~/Desktop/BrooBot
amplify init

# Add hosting
amplify add hosting

# Select options:
# - Hosting with Amplify Console
# - Manual deployment

# Publish your app
amplify publish
```

## Post-Deployment Steps

### 1. Set Up Authentication

Currently using mock auth. To enable real authentication:

#### Via Amplify Console (No CLI):

1. **In Amplify Console**:
   - Go to your BrooBot app
   - Click "Authentication" in left sidebar
   - Click "Set up authentication"

2. **Configure Authentication**:
   - Enable Email/Password sign-in
   - Configure password requirements
   - Enable Google OAuth:
     - Add Google Client ID
     - Add Google Client Secret
     - Configure redirect URLs

3. **Update Code**:
   - Download the `aws-exports.js` file
   - Add it to your project
   - Update `src/contexts/AuthContext.tsx` to use Amplify Auth

#### Via Amplify CLI:

```bash
# Add authentication
amplify add auth

# Select:
# - Default configuration with Social Provider
# - Email
# - Yes, configure Google

# Push changes
amplify push
```

### 2. Set Up Backend API

For Deep Research mode and AI Tool Assistant:

1. **Create API**:
   - In Amplify Console: Backend environments → API
   - Or via CLI: `amplify add api`

2. **Create Lambda Functions**:
   - Web scraping function
   - Document generation function
   - AI tool search function

3. **Connect to Frontend**:
   - Update `VITE_API_ENDPOINT` environment variable
   - Update `src/services/chatService.ts`

### 3. Configure DynamoDB (For Chat History)

1. **Create Tables**:
   - `BrooBot-Users`
   - `BrooBot-Sessions`
   - `BrooBot-Messages`

2. **Connect to App**:
   - Use Amplify DataStore or direct DynamoDB SDK
   - Update context providers to persist data

## Environment Variables Reference

### Required for Basic Deployment:
```
VITE_ANTHROPIC_API_KEY=sk-ant-xxx
VITE_APP_NAME=BrooBot
VITE_APP_VERSION=1.0.0
```

### After Auth Setup:
```
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_xxx
VITE_AWS_USER_POOL_WEB_CLIENT_ID=xxx
VITE_AWS_IDENTITY_POOL_ID=us-east-1:xxx
```

### After Backend Setup:
```
VITE_API_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/prod
```

## Monitoring and Maintenance

### 1. Monitor Deployments

In Amplify Console:
- View build logs
- Monitor deployment status
- Track errors and warnings

### 2. Set Up Alarms

1. Go to CloudWatch in AWS Console
2. Create alarms for:
   - High error rates
   - API latency
   - Lambda errors

### 3. Enable Logging

```yaml
# In amplify.yml, add:
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  customHeaders:
    - pattern: '**/*'
      headers:
        - key: 'Strict-Transport-Security'
          value: 'max-age=31536000; includeSubDomains'
        - key: 'X-Content-Type-Options'
          value: 'nosniff'
        - key: 'X-Frame-Options'
          value: 'DENY'
```

## Troubleshooting

### Build Fails

1. **Check build logs** in Amplify Console
2. **Common issues**:
   - Missing dependencies: Add to `package.json`
   - TypeScript errors: Run `npm run type-check` locally
   - Environment variables: Verify in Amplify Console

### App Loads But Broken

1. **Check browser console** for errors
2. **Verify environment variables** are set
3. **Check API endpoints** are correct

### Authentication Not Working

1. **Verify auth configuration** in Amplify Console
2. **Check redirect URLs** match your domain
3. **Verify Google OAuth credentials** (if using)

## Scaling Considerations

### For High Traffic:

1. **Enable Auto-scaling**:
   - Lambda concurrency limits
   - DynamoDB on-demand pricing

2. **Add CloudFront CDN**:
   - Automatically included with Amplify
   - Configure cache behaviors

3. **Optimize Build**:
   - Enable code splitting
   - Implement lazy loading
   - Optimize bundle size

## Cost Estimation

Typical monthly costs for moderate usage:

- **Amplify Hosting**: $0.01 per GB served + $0.023 per build minute
- **Lambda**: Free tier covers ~1M requests/month
- **DynamoDB**: Free tier covers 25GB storage
- **Cognito**: Free tier covers 50,000 MAUs
- **API Gateway**: $3.50 per million requests

**Estimated total for 1000 users**: $20-50/month

## Security Best Practices

1. **Enable HTTPS only** (automatic with Amplify)
2. **Set up WAF** for API protection
3. **Rotate API keys** regularly
4. **Use IAM roles** instead of keys where possible
5. **Enable MFA** for AWS account
6. **Regular security audits**

## CI/CD Pipeline

Amplify automatically sets up CI/CD:

1. **Push to Git** → Automatic deployment
2. **Pull Requests** → Preview deployments
3. **Multiple Branches** → Multiple environments

Configure in Amplify Console:
- Main branch → Production
- Develop branch → Staging
- Feature branches → Preview

## Rollback Procedure

If deployment breaks:

1. **In Amplify Console**:
   - Go to "Deployments"
   - Find last working version
   - Click "Redeploy this version"

2. **Via CLI**:
```bash
amplify env checkout <previous-env>
```

## Support Resources

- **AWS Amplify Docs**: https://docs.amplify.aws
- **AWS Support**: Your AWS account support tier
- **Community Forums**: https://github.com/aws-amplify/amplify-js/discussions

---

**Ready to Deploy!** 🚀

Your BrooBot application is production-ready and can be deployed to AWS Amplify using the steps above. The web-based Amplify Console approach is perfect for your situation and requires no CLI usage.
