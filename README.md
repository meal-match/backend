# Welcome to Meal Match Backend

This is a [JavaScript](https://en.wikipedia.org/wiki/JavaScript) application built with [NodeJS](https://nodejs.org/en) and [ExpressJS](https://expressjs.com/).

## Get Started

### Clone the repository

Clone the respository with the following commands.

```bash
mkdir MealMatch
cd MealMatch
git clone https://github.com/meal-match/backend
```

### Install dependencies

Install project dependencies with the following commands.

```bash
cd backend
npm install
```

### Install Required VSCode Extensions

Install the following required VSCode extensions.

-   SonarLint
-   ESLint
-   Prettier
-   Prettier ESLint

Optionally, install the following recommended VSCode extensions.

-   GitHub Copilot ([instructions for free student access](https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/managing-your-copilot-subscription/getting-free-access-to-copilot-as-a-student-teacher-or-maintainer)) **OR** Codeium
-   GitLens

### Configure environment variables

Create a `.env` file for local environment variables to be stored with the following command.

```bash
touch .env
```

Open the newly created `.env` file and enter all needed environment variables, listed below.

-   `PORT`: The port the application will run on. (optional, defaults to `3000`)

### Start the app

Start the app locally with the following command.

```bash
node --env-file=.env server.js
```

**Recommended:** Use `nodemon` to run the app. This will cause the app to redeploy after any changes are made, which is convenient for development. Do this with the following command.

```bash
nodemon --env-file=.env server.js
```

**Note:** If environment variables are configured differently than outlined above, the `--env-file` tag might need to be changed or removed.

## Development

### Branching

Before making changes, create a new branch off of `main`, since you will not be able to push directly to `main`. Your new branch's name should be [kebab-case](https://www.theserverside.com/definition/Kebab-case). Do this by running the following commands.

```bash
git pull
git checkout -b your-new-branch-name
```

### Staging, Committing, and Pushing

Follow [standard practices](https://dev.to/mrfrontend/git-101--step-2-add-stage-commit--push-3p3p) for staging, committing, and pushing your changes. As a general rule, commit often. Make commit messages concise but insightful so that development can be traced by commit history.

### Merging

When changes on your branch are ready to be merged into `main`, create a merge request. This request will need to be reviewed by 2 people before your changes can be merged.
