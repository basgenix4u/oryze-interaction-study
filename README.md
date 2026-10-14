# Oryze — étude d'interaction

Une seule action produit est étudiée ici : confirmer une relance préparée par Oryze Intelligence. Le maintien rend l'intention visible ; lorsqu'il aboutit, une nouvelle ligne apparaît dans l'historique. Cette page est une démonstration locale : aucun message n'est envoyé.

## Anneau

Le SVG reprend l'icône de production `oryze-icon.png` dans un `viewBox` de `1000 × 1000` : centre `(500, 499)`, rayon extérieur `306`, rayon intérieur `170` et rapport intérieur/extérieur `0,56`. Les secteurs sont des chemins en couronne à bords radiaux, jamais un `stroke-dasharray`.

Le balayage part de l'ouverture supérieure et avance dans le sens horaire. Quatre chemins servent à l'animation ; les deux secteurs Majorelle à droite se rejoignent sans joint visible, afin de garder le balayage continu de l'icône source. Les couleurs sont les jetons Oryze : Majorelle, rose et lavande.

## Exécution

```sh
corepack pnpm install
corepack pnpm dev
```

Aucune variable d'environnement n'est nécessaire. L'interaction accepte le pointeur, le toucher et Espace / Entrée. Un mouvement de plus de `10 px`, un relâchement anticipé, une sortie du bouton ou une perte de focus annule le maintien. `prefers-reduced-motion` raccourcit celui-ci à environ `250 ms` et retire les animations décoratives. La ligne haptique de la section 03 décrit l'extension Expo ; la page Web n'émet pas de vibration.

## Vérifications

```sh
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:interaction
```

Les tests Playwright couvrent l'annulation, le maintien au pointeur et au clavier, le raccourcissement tactile et réduit, ainsi que les largeurs `375`, `768` et `1440 px`. Installer Chromium pour les exécuter dans un environnement neuf avec `corepack pnpm exec playwright install chromium`.

Le site utilise Next.js 15, React 19 et Tailwind CSS 4. Les fontes IBM Plex sont chargées avec `next/font/google` et embarquées au build.

## Vercel

Importer le dépôt en tant que projet Next.js, en gardant la racine du dépôt comme répertoire du projet. Vercel détecte la commande de build ; aucune variable d'environnement n'est requise. Le domaine se configure ensuite dans les paramètres du projet.
