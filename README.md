# Generic Admin

Admin Next.js partageable entre plusieurs sites. Un deploiement correspond a un
site isole : sa propre DB Postgres/Supabase, ses propres variables
d'environnement, son propre stockage Vercel Blob et son propre profil de
configuration.

## Principe

- La codebase reste unique.
- `SITE_PROFILE` choisit la configuration du site au build/runtime.
- Chaque site utilise une DB separee, mais le contrat Prisma reste commun.
- Les modules existants restent disponibles : projets, services, articles,
  medias, taxonomies, pages, header, footer, langues et valeurs.
- Supabase OAuth, Vercel Blob, OpenAI et IndexNow sont requis pour la v1.

Profils inclus :

- `generic` : profil neutre utilise par defaut.
- `volante` : profil compatible avec le deploiement Volante existant.

## Variables d'environnement

Variables minimales pour un deploiement :

```bash
SITE_PROFILE=generic
APP_URL=https://admin.example.com
FRONTEND_APP_URL=https://www.example.com
DATABASE_URL=postgresql://...
SESSION_SECRET=une-valeur-de-32-caracteres-minimum

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_OAUTH_ISSUER=https://xxxx.supabase.co/auth/v1
SUPABASE_OAUTH_CLIENT_ID=...
SUPABASE_OAUTH_CLIENT_SECRET=...

BLOB_READ_WRITE_TOKEN=...
OPENAI_API_KEY=...
INDEXNOW_KEY=...
```

Notes :

- `SITE_PROFILE` vaut `generic` si absent.
- Pour Volante, definir explicitement `SITE_PROFILE=volante`.
- `APP_URL` sert de fallback serveur hors requete HTTP. Le callback OAuth utilise
  l'origin de la requete courante, ce qui permet aux previews Vercel de revenir
  sur leur propre URL.
- `FRONTEND_APP_URL` sert aux notifications IndexNow.

## Nouveau site

1. Creer un projet Supabase et recuperer l'URL Postgres.
2. Configurer Supabase OAuth avec le callback :

```text
https://admin.example.com/api/auth/callback/supabase
```

Pour les previews Vercel, autoriser aussi l'URL preview concernee ou un pattern
compatible dans la configuration OAuth Supabase, par exemple :

```text
https://*.vercel.app/api/auth/callback/supabase
```

3. Creer le projet Vercel de l'admin.
4. Ajouter toutes les variables d'environnement.
5. Ajouter ou adapter un profil dans `lib/site-profile.ts`.
6. Ajouter les memes defaults dans `scripts/site-profile-data.mjs` pour le seed.
7. Initialiser la DB vide :

```bash
npm run db:bootstrap
```

Cette commande :

- applique le schema Prisma courant avec `prisma db push`;
- marque les migrations historiques comme appliquees;
- insere les locales, routes et contenus par defaut du profil.

8. Deployer sur Vercel :

```bash
npm run build
```

## Seed

Pour reappliquer les defaults du profil sans recréer le schema :

```bash
npm run db:seed
```

Le seed est idempotent. Il met a jour les donnees structurelles suivantes :

- `SiteLocale`
- `SiteRoute` et traductions
- `PageHeaderContent`
- `HomePageContent` et traductions
- `FooterContent` et traductions
- `StudioPageContent`

Il ne supprime pas les contenus existants comme projets, services, medias ou
articles.

## Frontend d'un site

Le frontend du site doit utiliser sa propre DB du meme site, pas une DB commune
entre clients. Pour la v1, le frontend lit directement le meme schema Prisma que
l'admin du site.

Checklist frontend :

- pointer `DATABASE_URL` vers la DB du site;
- garder le schema Prisma compatible avec `volante-admin/prisma/schema.prisma`;
- utiliser les routes et locales stockees en DB;
- utiliser `FRONTEND_APP_URL` coherent avec l'admin pour IndexNow.

## Developpement local

```bash
nvm use
npm install
npm run db:bootstrap
npm run dev
```

L'admin demarre sur le port Next.js par defaut. Utiliser `APP_URL` pour forcer
l'origin publique attendue par OAuth.

## Verification avant release

```bash
nvm use
npm run lint
npm run build
```

Pour eviter une regression sur Volante :

```bash
SITE_PROFILE=volante npm run build
```

Verifier ensuite manuellement :

- le branding dans le login et le menu;
- les routes header/footer;
- les pages Home, Studio, Footer;
- l'upload media;
- les actions IA;
- la connexion Supabase OAuth.
