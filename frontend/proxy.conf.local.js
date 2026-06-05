/**
 * Dev proxy — API uniquement.
 * Les navigations navigateur (F5 sur /admin/...) doivent rester sur Angular (index.html),
 * sinon le proxy envoie la page vers la gateway → HTTP 403.
 */
function shouldServeSpa(req) {
  const accept = req.headers.accept || '';
  return req.method === 'GET' && accept.includes('text/html');
}

const target = 'http://localhost:8080';

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
