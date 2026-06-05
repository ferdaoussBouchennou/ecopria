function shouldServeSpa(req) {
  const accept = req.headers.accept || '';
  return req.method === 'GET' && accept.includes('text/html');
}

const target = 'http://localhost:8088';

module.exports = [
  {
    context: ['/api', '/uploads'],
    target,
    secure: false,
    changeOrigin: true,
  },
  {
    context: ['/admin'],
    target,
    secure: false,
    changeOrigin: true,
    bypass(req) {
      if (shouldServeSpa(req)) {
        return '/index.html';
      }
    },
  },
];
