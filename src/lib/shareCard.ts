// Image d'invitation (format statut WhatsApp / story, 1080×1920) générée dans le navigateur.
// Partage direct vers WhatsApp, Instagram… quand le téléphone le permet, sinon téléchargement.
import { Platform } from 'react-native';

export type CardInfo = {
  emoji: string; name: string; cotisation: string; frequence: string; membres: string; code: string; createur: string;
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

async function draw(c: CardInfo): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1C1A17'); g.addColorStop(1, '#3A2F18');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // motif de cercles (tour de rôle)
  ctx.strokeStyle = 'rgba(226,195,106,0.18)'; ctx.lineWidth = 3;
  for (let r = 180; r <= 540; r += 120) { ctx.beginPath(); ctx.arc(W / 2, 520, r, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? '#E2C36A' : '#C9A13B';
    ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * 300, 520 + Math.sin(a) * 300, 26, 0, Math.PI * 2); ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.font = '160px serif'; ctx.fillStyle = '#FFFFFF';
  ctx.fillText(c.emoji || '🤝', W / 2, 580);

  ctx.fillStyle = '#E2C36A'; ctx.font = 'bold 44px sans-serif';
  ctx.fillText('REJOINS MA TONTINE', W / 2, 960);

  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 84px sans-serif';
  wrap(ctx, c.name, W - 160).forEach((l, i) => ctx.fillText(l, W / 2, 1070 + i * 96));

  ctx.font = '46px sans-serif'; ctx.fillStyle = '#E4DED3';
  ctx.fillText(`${c.cotisation} · ${c.frequence}`, W / 2, 1330);
  ctx.fillText(`${c.membres} · organisée par ${c.createur}`, W / 2, 1400);

  // carte du code
  ctx.fillStyle = '#F6EED8';
  const bx = 160, by = 1480, bw = W - 320, bh = 200;
  ctx.beginPath(); (ctx as any).roundRect ? (ctx as any).roundRect(bx, by, bw, bh, 36) : ctx.rect(bx, by, bw, bh); ctx.fill();
  ctx.fillStyle = '#8F6F1E'; ctx.font = 'bold 34px sans-serif';
  ctx.fillText('CODE D’INVITATION', W / 2, by + 62);
  ctx.fillStyle = '#1C1A17'; ctx.font = 'bold 96px monospace';
  ctx.fillText(c.code, W / 2, by + 160);

  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 48px sans-serif';
  ctx.fillText('senetontine.com', W / 2, 1800);
  ctx.fillStyle = '#B8B0A2'; ctx.font = '34px sans-serif';
  ctx.fillText('Vos tontines, simples et transparentes', W / 2, 1855);

  return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
}

// Renvoie 'shared' (fenêtre de partage ouverte), 'downloaded' (image enregistrée) ou 'unsupported'.
export async function shareTontineCard(c: CardInfo, link: string): Promise<'shared' | 'downloaded' | 'unsupported'> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return 'unsupported';
  const blob = await draw(c);
  const file = new File([blob], `tontine-${c.code}.png`, { type: 'image/png' });
  const nav = navigator as any;
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: `Rejoins ma tontine « ${c.name} » sur SèneTontine 🤝 Code : ${c.code}\n${link}` });
      return 'shared';
    } catch { /* partage annulé : on télécharge */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
