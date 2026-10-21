// app/+html.tsx — Squelette HTML de la version web (PWA). Utilisé uniquement au build web.
import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

const registerSw = `
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event('installable'));
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}`;

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>SèneTontine – Gérer sa tontine en ligne au Sénégal</title>
        <meta name="description" content="SèneTontine : crée et suis tes tontines entre proches, cotisations Wave et Orange Money, tours de rôle et rappels, simplement et en toute transparence. Gratuit pour commencer." />
        <meta name="keywords" content="tontine, tontine en ligne, tontine Sénégal, application tontine, Wave, Orange Money, épargne" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SèneTontine" />
        <meta property="og:title" content="SèneTontine – Vos tontines, simples et transparentes" />
        <meta property="og:description" content="Crée et suis tes tontines entre proches : cotisations, tours de rôle, rappels. Gratuit pour commencer." />
        <meta property="og:url" content="https://senetontine.com/" />
        <meta property="og:image" content="https://senetontine.com/icons/icon-512.png" />
        <meta property="og:locale" content="fr_SN" />
        <meta name="twitter:card" content="summary" />
        <meta name="theme-color" content="#F7F5F0" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SèneTontine" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'body{background-color:#F7F5F0;}' }} />
        <script dangerouslySetInnerHTML={{ __html: registerSw }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
