const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (index.html, CSS, JS, and videos)
app.use(express.static(__dirname));

// API endpoint: scan the videos folder recursively
app.get('/api/movies', (req, res) => {
    const videosDir = path.join(__dirname, 'videos');
    const movieList = [];

    function scanDirectory(dir, basePath = '') {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = basePath ? path.join(basePath, entry.name) : entry.name;

            if (entry.isDirectory()) {
                // Recurse into subfolder
                scanDirectory(fullPath, relPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase().slice(1);
                const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', 'mpg', 'mpeg'];
                if (videoExts.includes(ext)) {
                    // Use the parent folder name as the movie title
                    const folderName = path.basename(dir);
                    // Avoid duplicates: if the same folder has multiple videos, keep only the first
                    const existing = movieList.find(m => m.folderName === folderName);
                    if (!existing) {
                        movieList.push({
                            folderName: folderName || 'Untitled',
                            videoFile: entry.name,
                            path: relPath,
                            posterSeed: folderName.replace(/\s/g, '').toLowerCase() || 'movie'
                        });
                    }
                }
            }
        }
    }

    if (fs.existsSync(videosDir)) {
        scanDirectory(videosDir);
        // Sort alphabetically by folder name
        movieList.sort((a, b) => a.folderName.localeCompare(b.folderName));
        res.json(movieList);
    } else {
        res.status(404).json({ error: 'videos folder not found' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ CineVault server running at http://localhost:${PORT}`);
    console.log(`📁 Watching for videos in: ${path.join(__dirname, 'videos')}`);
});
