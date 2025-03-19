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
-   Biome
-   SonarQube

Optionally, install the following recommended VSCode extensions.

-   GitHub Copilot ([instructions for free student access](https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/managing-your-copilot-subscription/getting-free-access-to-copilot-as-a-student-teacher-or-maintainer)) **OR** Codeium
-   GitLens

### Configure environment variables

Create a `.env` file for local environment variables to be stored with the following command.

```bash
touch .env
```

Open the newly created `.env` file and enter all needed environment variables, listed below.

-   `CLIENT_URL`: The URL of the frontend application.
-   `CLOUDINARY_CLOUD_NAME`: The Cloudinary cloud name.
-   `CLOUDINARY_API_KEY`: The Cloudinary API key.
-   `CLOUDINARY_API_SECRET`: The Cloudinary API secret.
-   `CLOUDINARY_FOLDER`: The folder in Cloudinary where our receipts are stored.
-   `DB_USERNAME`: The username the application will use to connect to the database.
-   `DB_PASSWORD`: The corresponding password for `DB_USERNAME`.
-   `DB_CLUSTER_URL`: The URL of the database cluster. This is what comes after the "@" but before the query parameters in the full connection URL.
-   `DB_NAME`: The name of the database.
-   `EMAIL_ADDRESS`: The email address being logged into.
-   `EMAIL_HOST`: The email SMTP host address.
-   `EMAIL_PASS`: The password to the email address.
-   `EMAIL_PORT`: The port of the SMTP email server.
-   `ENVIRONMENT`: The environment of the deployment (`dev` or `prod`).
-   `INTERVAL_CLIENT_TOKEN`: Token to pass for interval client routes.
-   `LOCAL`: Boolean as to whether the environment is locally deployed or on a remote server, such as Vercel.
-   `PORT`: The port the application will run on (optional, defaults to `3000`).
-   `SESSION_SECRET`: The string used to encode session data.
-   `STRIPE_SECRET_KEY`: The client secret that will be used to login to [Stripe](https://dashboard.stripe.com).
-   `WEBSITE_URL`: The URL of the [project's website](https://github.com/meal-match/website).

### Start the app

Start the app locally with the following command.

```bash
npm run startlocal
```

**Note:** `npm run start` can also be used, but `startlocal` is recommended as it utilizes `nodemon` to restart the app automatically when changes are made. `npm run start` should be used in a production environment.

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

When changes on your branch are ready to be merged into `main`, create a pull request. This request will need to be reviewed by one other person before your changes can be merged.
