# Documentation Mapper Plugin

A Figma plugin for automatically generating documentation from your design files.

## Current Version: 0.2.5 (Stable)

## Features

- 📝 Automatically documents all interactions in your Figma file
- 🎯 Groups interactions by their parent frames
- 🔍 Supports both page-wide and selection-based documentation
- 💬 Human-readable interaction descriptions
- 🎨 Clean, organized documentation layout
- ⚡ Efficient memory management and performance

## Setup

1. Clone the repository:
```bash
git clone https://github.com/floringheorghiu/figma-friday.git
cd figma-friday
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Import into Figma:
- Open Figma
- Go to Plugins > Development > Import plugin from manifest
- Select the `manifest.json` file from this project

## Development

- Run development server:
```bash
npm run dev
```

- Run tests:
```bash
npm run test
```

- Build for production:
```bash
npm run build
```

## Usage

1. Select the scope:
   - Current Page: Documents all interactions on the current page
   - Current Selection: Documents interactions only in selected frames/elements

2. Click "Generate Documentation" to create a new documentation frame

3. The plugin will create a new frame containing:
   - Grouped interactions by parent frame
   - Human-readable descriptions
   - Interaction counts and details

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Version History

See [VERSION.md](VERSION.md) for detailed version history and changelog.