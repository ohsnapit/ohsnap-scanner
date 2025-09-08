# OhSnap Scanner

A Next.js application for scanning and exploring Farcaster user data using the OhSnap API,connected to OhSnap endpoints.

## Features

- **Search Interface**: Clean search page to look up users by FID
- **User Profiles**: Detailed user profile pages with multiple tabs:
  - **Overview**: Basic user information, follower counts, verification status
  - **Addresses**: Verified ETH/SOL addresses and auth addresses
  - **Signers**: Signer information (placeholder for future implementation)
  - **Recent Casts**: Latest casts from the user
  - **Raw Data**: JSON view of the complete user data

## Technology Stack

- Next.js 15.5.2
- React 19
- TypeScript
- Tailwind CSS 4
- OhSnap API integration

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Search**: Enter a Farcaster ID (FID) in the search box on the home page
2. **Browse**: Click on the quick link buttons for sample FIDs (3, 2, 9, 860783)
3. **Explore**: View detailed user information across different tabs
4. **Recent Casts**: See the latest posts from any user

## API Integration

This application connects to the OhSnap API and uses the following endpoints:

- `/v1/user?fid={fid}` - Get user profile data
- `/v1/user/casts?fid={fid}&limit=25` - Get user's recent casts

## Design

The interface closely mimics the Casterscan design with:
- Clean, minimal layout
- Tabbed navigation for different data views
- Responsive design
- Purple accent color for branding

## Future Enhancements

- Add signer information when available from the API
- Implement cast search functionality
- Add pagination for casts
- Include cast interactions and replies
- Add more detailed cast metadata display
