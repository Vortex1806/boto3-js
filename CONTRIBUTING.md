# **Contributing to Boto3-JS**

First off, thank you for considering contributing\! 🚀  
This guide will help you understand how to contribute effectively.

## **🌳 Branch Naming Convention**

Follow these conventions for branch names:

### **🔧 1\. Minor Fixes / Small Changes**

fix/\<short-description\>

**Examples:**

- fix/readme-typo
- fix/update-logging
- fix/memory-leak

Use this for:

- Correcting typos
- Small config updates
- Minor refactors or documentation tweaks

### **🚀 2\. New Features**

feature/\<feature-name\>

**Examples:**

- feature/add-s3-client
- feature/auth-middleware
- feature/user-dashboard

Use this for:

- Adding new functions, modules, or enhancements
- Implementing functionality changes

### **🐛 3\. Bug Fixes**

bugfix/\<bug-description\>

**Examples:**

- bugfix/s3-upload-error
- bugfix/invalid-env-handling
- bugfix/timeout-issue

Use this for:

- Fixing reported bugs
- Logic or runtime errors

### **🧱 4\. Major Refactors / Architecture Changes**

refactor/\<module-or-component\>

**Examples:**

- refactor/aws-wrapper-structure
- refactor/api-layer
- refactor/utils

Use this for:

- Restructuring code without changing functionality
- Improving readability or maintainability

### **⚙️ 5\. CI/CD or DevOps Changes**

ci/\<change-description\>

**Examples:**

- ci/github-actions-setup
- ci/dockerfile-optimization
- ci/add-lint-step

Use this for:

- Modifying pipelines, workflows, or build scripts

### **🧪 6\. Testing / Experiments**

test/\<experiment-name\>

**Examples:**

- test/load-performance
- test/ai-agent-integration

Use this for:

- Trying new ideas
- Benchmarking or testing experimental features

### **📦 7\. Releases (Optional)**

release/v\<version-number\>

**Example:**

- release/v1.2.3

Use this when:

- Preparing a new release branch
- Version bumps for npm packages

## **🛠 How to Contribute**

1. **Fork** the repository.
2. **Create a branch** following the naming conventions.
3. **Make your changes** and ensure tests pass.
4. **Commit your changes** with clear messages.
5. **Push your branch** to your fork.
6. **Open a Pull Request** against the main branch.

## **🔎 Code Style & Testing**

- Follow consistent indentation and naming conventions.
- Include tests for new features or bug fixes.
- Run all tests before submitting a PR:  
  npm run test

### **📄 Additional Notes**

- Document new methods/classes in README.md or API.md.
- Link related issues in PR descriptions.
- Be respectful in code reviews and discussions.

Thank you for helping improve Boto3-JS\! 💪
