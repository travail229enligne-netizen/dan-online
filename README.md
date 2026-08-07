# Dan-Online — Le Marché de Dantokpa chez vous

MVP d'une marketplace multi-vendeurs (type marché digitalisé) : les marchands louent un
emplacement virtuel ("allée numérique"), vendent leurs produits, et la plateforme prélève
une commission sur chaque vente. Paiement exclusivement **à la livraison (COD)**, livraison
annoncée sous **48h**.

## 1. Architecture technique

```
Client mobile (React Native) ─┐
Client web (Next.js) ──────────┼──► API REST (Node.js/Express) ──► MongoDB (Atlas)
Dashboard marchand (Next.js) ──┘
```

- **Backend** : Node.js + Express, MongoDB/Mongoose, JWT pour l'authentification,
  middlewares de rôle (`client`, `marchand`, `admin`).
- **Frontend web** : Next.js (React), responsive, réutilisable comme base pour le catalogue
  côté navigateur et comme référence de design pour l'app mobile.
- **Mobile** : React Native (Expo recommandé pour packager rapidement vers le Play Store),
  consommant la même API REST. Voir section 5.
- **Paiement** : COD uniquement pour le MVP (`paymentMethod: "cod"`) — pas d'intégration
  Mobile Money nécessaire au lancement, ajoutable plus tard (MTN MoMo, Moov Money, etc.).

## 2. Arborescence du projet

```
dan-online/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── render.yaml
│   └── src/
│       ├── server.js                # point d'entrée Express
│       ├── config/db.js             # connexion MongoDB
│       ├── models/
│       │   ├── User.js              # client / marchand / admin
│       │   ├── Shop.js              # boutique = emplacement virtuel
│       │   ├── Category.js          # allées numériques
│       │   ├── Product.js
│       │   └── Order.js             # commandes COD
│       ├── middleware/
│       │   ├── auth.js              # vérification JWT
│       │   └── roles.js             # autorisation par rôle
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── shopController.js
│       │   ├── productController.js
│       │   ├── orderController.js
│       │   └── adminController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── shopRoutes.js
│       │   ├── productRoutes.js
│       │   ├── orderRoutes.js
│       │   ├── adminRoutes.js
│       │   └── categoryRoutes.js
│       └── seed.js                  # données de démo (catégories + compte admin)
│
└── frontend-web/
    ├── package.json
    ├── next.config.js
    ├── vercel.json
    ├── .env.local.example
    ├── lib/api.js                   # client Axios centralisé
    ├── styles/globals.css           # tokens de design (couleurs, typographies)
    ├── components/
    │   ├── Header.js
    │   ├── HeroBanner.js
    │   ├── CategoryGrid.js
    │   └── ProductCard.js
    └── pages/
        ├── _app.js
        ├── index.js                 # page d'accueil marketplace
        └── marchand/dashboard.js    # dashboard marchand
```

## 3. Modèle de données — points clés

- **User.role** : `client` | `marchand` | `admin`. Un compte marchand est créé avec
  `role: "marchand"` mais sa boutique reste `status: "pending"` tant que l'admin ne l'a pas
  validée (`PUT /api/admin/shops/:id/validate`).
- **Shop.location** : `{ allee, numero }` représente l'emplacement virtuel loué (ex. "Allée 3,
  N°45"), avec un `rent` (loyer périodique) géré par l'admin.
- **Shop.commissionRate** : commission spécifique à une boutique ; sinon la valeur par
  défaut `DEFAULT_COMMISSION_RATE` (variable d'environnement) s'applique.
- **Order** : chaque commande calcule automatiquement `commissionAmount` au moment de la
  création, à partir du taux de commission de chaque boutique concernée.

## 4. Lancer le projet en local

### Backend
```bash
cd backend
cp .env.example .env      # renseigner MONGO_URI et JWT_SECRET
npm install
npm run seed               # crée les catégories + un compte admin de démo
npm run dev                # démarre sur http://localhost:5000
```

### Frontend web
```bash
cd frontend-web
cp .env.local.example .env.local
npm install
npm run dev                # démarre sur http://localhost:3000
```

## 5. Roadmap vers le Play Store (1 à 2 mois)

L'app mobile n'est pas incluse dans ce livrable (le MVP fourni couvre l'API + le web), mais
elle consomme la **même API**. Recommandation pour aller vite :

1. `npx create-expo-app dan-online-mobile` (Expo simplifie énormément le build Android/iOS).
2. Réutiliser directement `lib/api.js` (Axios) et la palette de `styles/globals.css` comme
   design system (couleurs `--green-deep`, `--terracotta`, `--gold`, `--cream`).
3. Écrans prioritaires pour le MVP mobile : Accueil, Détail boutique, Détail produit, Panier,
   Suivi de commande, Connexion/Inscription.
4. `eas build --platform android` (Expo Application Services) génère l'APK/AAB pour le Play
   Store sans configuration native manuelle.
5. Compter ~2-3 semaines de développement des écrans + 1-2 semaines de tests et de
   préparation de la fiche Play Store (captures, politique de confidentialité, compte
   développeur Google à 25 $ une seule fois).

## 6. Déploiement — étape par étape

### A. Pousser le projet sur GitHub
```bash
cd dan-online
git init
git add .
git commit -m "Initial commit — Dan-Online MVP"
git branch -M main
git remote add origin https://github.com/<votre-compte>/dan-online.git
git push -u origin main
```
Astuce : gardez `backend/` et `frontend-web/` dans **un seul repo** (monorepo) pour ce MVP —
plus simple à gérer à ce stade ; vous pourrez les séparer plus tard si l'équipe grandit.

### B. Base de données — MongoDB Atlas
1. Créez un cluster gratuit sur https://www.mongodb.com/atlas
2. Créez un utilisateur de base de données et autorisez l'accès réseau (0.0.0.0/0 pour
   démarrer, à restreindre ensuite).
3. Copiez la chaîne de connexion dans `MONGO_URI`.

### C. Backend sur Render
1. Sur https://render.com, "New Web Service" → connectez votre repo GitHub.
2. Render détecte `backend/render.yaml` si vous pointez le **Root Directory** sur `backend`.
3. Renseignez les variables d'environnement marquées `sync: false` dans le tableau de bord
   Render (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`).
4. Déployez — Render vous donne une URL du type `https://dan-online-backend.onrender.com`.

### D. Frontend sur Vercel
1. Sur https://vercel.com, "New Project" → importez le même repo GitHub, en réglant le
   **Root Directory** sur `frontend-web`.
2. Ajoutez la variable d'environnement `NEXT_PUBLIC_API_URL` =
   `https://dan-online-backend.onrender.com/api`.
3. Déployez — Vercel fournit une URL type `https://dan-online.vercel.app`.
4. Retournez sur Render et mettez à jour `CLIENT_URL` avec cette URL Vercel (pour le CORS).

### E. Domaine personnalisé (optionnel)
Ajoutez un domaine (ex. `dan-online.bj`) dans les réglages Vercel, puis un enregistrement
CNAME chez votre registrar.

## 7. Sécurité et prochaines étapes recommandées

- Ajouter `express-rate-limit` sur les routes d'authentification.
- Uploader les images produits/boutiques vers Cloudinary ou un bucket S3 plutôt que des URLs
  brutes (le champ `images` accepte déjà un tableau d'URLs, prêt pour cette intégration).
- Ajouter des notifications SMS (ex. via l'API d'un opérateur local) à chaque changement de
  statut de commande, essentiel pour un flux COD sans app de paiement.
- Ajouter des tests (Jest + Supertest côté backend) avant la mise en production.
