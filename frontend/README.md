# ERP Project - Frontend

This is the frontend component of the ERP project, built using **React 19**, **JavaScript**, and **Vite**.

## Features

- **React 19**: Utilizing the latest React features and optimizations.
- **Vite 8**: Extremely fast development environment and optimized builds.
- **React Compiler**: Automatically optimizes your components for better performance.
- **JavaScript (JSX)**: Simplified development without TypeScript overhead.
- **ESLint 9**: Modern linting configuration for code quality.
- **Docker Support**: Containerized environment for consistent deployment.

## Prerequisites

- [Node.js](https://nodejs.org/) (Version 20 or higher recommended)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (Optional, for containerization)

## Getting Started

### Installation

1. Clone the repository (if not already done).
2. Navigate to the frontend directory:
   ```bash
   cd erp_project/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

Create an optimized production build in the `dist/` directory:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### Linting

Check for code quality issues:

```bash
npm run lint
```

## Project Structure

- `src/`: Source code directory.
  - `main.jsx`: Entry point for the application.
  - `App.jsx`: Root component.
  - `assets/`: Static assets (images, icons, etc.).
- `public/`: Public assets that are served as-is (e.g., `favicon.svg`, `icons.svg`).
- `docker/`: Docker-related configuration files.
- `eslint.config.js`: ESLint flat configuration.
- `vite.config.js`: Vite and Babel configuration.

## Docker

### Building the Image

To build the Docker image for the frontend:

```bash
docker build -t erp-frontend -f Dockerfile ..
```
*(Note: Build context is the parent directory as per the current Dockerfile configuration)*

### Running the Container

```bash
docker run -p 8080:80 erp-frontend
```

The application will be accessible at `http://localhost:8080`.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS
- **Linting**: ESLint 9
- **Compiler**: Babel with React Compiler plugin
