# VDURA Storage Performance Comparison

An interactive web application demonstrating the performance and cost advantages of VDURA's hybrid SSD+HDD storage system for GPU checkpoint workloads.

## Features

- **Real-time Performance Visualization**: Side-by-side comparison of VDURA vs all-flash competitors
- **Interactive Configuration**: Adjust GPU count, checkpoint size, and intervals
- **Dynamic Metrics**: Live GPU hours gained calculation and cost analysis
- **Visual Storage Representation**: Animated SSD and HDD activity indicators
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React + Vite
- **Styling**: CSS3 with animations
- **Deployment**: AWS Amplify (configured)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to view the app.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Performance Highlights

- **VDURA System**: 40 GB/s write speed with 12 fast SSDs + HDD tiering
- **Competitor**: 20 GB/s write speed with all-flash storage
- **Cost Savings**: Up to 8x lower storage cost per TB
- **GPU Efficiency**: Reduced checkpoint time = more GPU hours for training

## Deployment

### AWS Amplify

This app is configured for AWS Amplify deployment:

1. Push code to GitHub
2. Connect repository to AWS Amplify
3. Amplify will auto-detect `amplify.yml` and deploy

### Manual Deployment

The `dist` folder can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- S3 + CloudFront

## Configuration

The app allows users to configure:
- **GPU Count**: 1-128 GPUs
- **Checkpoint Size**: 1-10 TB
- **Checkpoint Interval**: 15-120 minutes
- **Simulation Speed**: 1x, 2x, 5x, 10x, 100x

## Architecture

### Components

- `App.jsx`: Main application logic and state management
- `ConfigPanel.jsx`: User input controls
- `VduraSystem.jsx`: VDURA hybrid storage visualization
- `CompetitorSystem.jsx`: Competitor all-flash visualization
- `MetricsDisplay.jsx`: Performance metrics and cost analysis

### Performance Calculations

- **Write Time**: Checkpoint size ÷ bandwidth
- **GPU Hours Gained**: (Competitor time - VDURA time) × GPU count
- **Cost Analysis**: SSD vs HDD pricing with capacity requirements

## License

Proprietary - VDURA Technologies

## Contact

For questions or support, contact: erik@vdura.com
