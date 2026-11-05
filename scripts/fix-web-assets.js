// Cloudflare Pages n'envoie jamais les dossiers nommés "node_modules" : les polices d'icônes
// exportées par Expo dans dist/assets/node_modules/... seraient introuvables (carrés vides).
// On renomme ce dossier en dist/assets/nm et on corrige les chemins dans les fichiers générés.
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'nm');

if (!fs.existsSync(from)) {
  console.log('fix-web-assets : rien à faire');
  process.exit(0);
}
fs.renameSync(from, to);

let changed = 0;
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(js|html|css|json|map)$/.test(name)) continue;
    const s = fs.readFileSync(p, 'utf8');
    if (s.includes('/assets/node_modules/')) {
      fs.writeFileSync(p, s.split('/assets/node_modules/').join('/assets/nm/'));
      changed++;
    }
  }
})(dist);
console.log(`fix-web-assets : dossier renommé, ${changed} fichier(s) corrigé(s)`);

// SPA fallback : Cloudflare Pages sert 404.html pour les routes sans fichier correspondant.
// En copiant index.html → 404.html, toutes les URL de l'app (admin, profil, etc.) fonctionnent
// même après un refresh ou un accès direct, sans boucle de redirection.
const indexPath = path.join(dist, 'index.html');
const notFoundPath = path.join(dist, '404.html');
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('fix-web-assets : 404.html créé (SPA fallback Cloudflare)');
}
