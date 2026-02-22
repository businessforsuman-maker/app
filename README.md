# Anime URL Validator

A web-based tool to validate anime video URLs from AnimeLok API and detect "Video not found" errors.

## Features

- **Upload JSON Data**: Import your anime database with AnimeLok IDs
- **Batch URL Validation**: Automatically fetch and validate video URLs from AnimeLok API
- **Error Detection**: Identifies "Video not found" and other error responses
- **Real-time Progress**: Shows validation progress as it processes
- **Results Dashboard**: Filter and view valid/invalid URLs
- **CSV Export**: Download validation results for further analysis

## How to Use

1. **Upload Your Data**: Click "Choose JSON File" and select your anime JSON file
   - Expected format: Array of objects with `animelok_id`, `animerulz_id`, and `languages` fields
   
2. **Start Validation**: Click "Start Validation" to begin checking URLs
   - The tool will fetch video URLs from AnimeLok API for each anime
   - It checks each URL for "Video not found" errors
   
3. **Review Results**: View results in the dashboard with filtering options
   - **All**: Shows all validation results
   - **Valid**: Shows only working video URLs
   - **Invalid**: Shows URLs with errors or "Video not found"

4. **Export Results**: Click "Export CSV" to download results for analysis

## API Integration

The validator uses the AnimeLok API:
```
https://animelok.streamindia.co.in/api/anime?id={animelok_id}&ep={episode}
```

Response format:
```json
{
  "multi": "https://video-url.com/video/hash",
  "cached": true,
  "expiresAt": "2026-03-07T05:22:52.727Z"
}
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Click "Deploy"

3. **Environment Variables** (Optional):
   - `VITE_ANALYTICS_ENDPOINT`: Analytics endpoint URL
   - `VITE_ANALYTICS_WEBSITE_ID`: Analytics website ID

### Deploy Locally

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
anime-url-validator/
├── client/
│   ├── public/
│   │   └── anime-data.json       # Sample anime data
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx          # Main validator page
│   │   ├── components/           # Reusable UI components
│   │   ├── App.tsx               # App router
│   │   ├── main.tsx              # React entry point
│   │   └── index.css             # Global styles
│   └── index.html                # HTML template
├── server/                        # Express server (for production)
├── package.json
├── vercel.json                   # Vercel configuration
└── README.md
```

## Technologies

- **React 19**: UI framework
- **Vite**: Build tool
- **Tailwind CSS 4**: Styling
- **shadcn/ui**: Component library
- **Wouter**: Client-side routing

## JSON Format

Your anime data should be in this format:

```json
[
  {
    "animerulz_id": "jujutsu-kaisen-the-culling-game-part-1-20401",
    "animelok_id": "jujutsu-kaisen-3x1",
    "languages": ["hindi", "tamil", "telugu"]
  },
  {
    "animerulz_id": "naruto-shippuden-355",
    "animelok_id": "naruto-shippuden-1735",
    "languages": ["hindi", "tamil", "telugu", "malayalam", "bengali"]
  }
]
```

## Troubleshooting

### CORS Issues
If you encounter CORS errors when validating URLs:
- The validator uses `no-cors` mode for initial requests
- Some video servers may block requests from browsers
- Consider using a backend proxy for production

### Rate Limiting
- AnimeLok API may have rate limits
- The validator processes requests sequentially to avoid overload
- For large datasets, consider splitting validation into batches

### Video URL Validation
The tool checks for:
- "Video not found" error messages
- HTTP 404 responses
- Error HTML responses
- Empty or missing video URLs

## License

MIT

## Support

For issues or feature requests, please create an issue in the repository.
