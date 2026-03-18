const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 8000;

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon',
};


const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Handle /secret route
    if (filePath === '/secret') {
        filePath = '/remote.html';
    }
    
    filePath = path.join(__dirname, filePath.split('?')[0]);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const io = new Server(server);

io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('changeSlide', i => {
        socket.broadcast.emit('slideChanged', i);
    });

    socket.on('toggleMusic', playing => {
        socket.broadcast.emit('musicToggle', playing);
        socket.broadcast.emit('musicStatus', playing);
    });

    socket.on('toggleStatsBg', pattern => {
        socket.broadcast.emit('statsBgChanged', pattern);
    });

    socket.on('toggleVideoFullscreen', data => {
        socket.broadcast.emit('videoFullscreenChanged', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// File watcher for live reload
fs.watch(__dirname, { recursive: true }, (event, filename) => {
    if (filename && !filename.includes('node_modules') && !filename.includes('.git')) {
        io.emit('fileChanged');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Remote control: http://localhost:${PORT}/secret`);
    console.log('Live reload enabled - files will auto-refresh on change');
});
