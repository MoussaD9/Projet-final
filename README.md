# CommandeFacile — SaaS futuriste de gestion des commandes

*Toutes vos commandes. Un espace clair. Zéro oubli.*

Prototype front-end (HTML/CSS/JS natifs, sans backend) pour les petits commerçants du Sénégal qui reçoivent des commandes par WhatsApp, Instagram, Facebook, téléphone ou en boutique. Interface en français, montants en FCFA, thème sombre par défaut (thème clair dans Paramètres).

## Fonctionnalités
- **Compte de démonstration** : inscription (validation, e-mail unique), connexion, bouton « Entrer dans la démo », déconnexion (n'efface rien).
- **Mon profil** : modification des informations, initiales en avatar (pas de photo dans ce prototype), annulation des changements, suppression du profil avec confirmation.
- **Commandes** : création, modification, suppression confirmée, détails, statuts, source, recherche (client, téléphone, produit, zone, n°), filtre statut, tri par date, réinitialisation.
- **Tableau de bord** : indicateurs calculés ; CA = commandes « Livrée » uniquement ; « Non livrées » affiché à part.
- **WhatsApp** : lien `wa.me` avec message prérempli (liste et détails). Vous devez vérifier et envoyer le message vous-même. Aucun préfixe pays n'est deviné.
- **Export** CSV/JSON, commandes d'exemple (sur demande, marquées « EXEMPLE »).

## Lancer
Ouvrez `index.html`, ou utilisez Live Server dans VS Code. Fichiers : `index.html`, `style.css`, `script.js`, `README.md`.

## Tests manuels
Inscription (champs vides, e-mail invalide, doublon) → profil modifié puis rechargement → déconnexion/reconnexion → deux profils : commandes distinctes → commande valide / quantité 0 ou décimale refusée → total = prix × quantité + livraison → statuts et statistiques → recherche/tri/reset → WhatsApp numéro valide et invalide → export → clavier (Tab, Échap) → mobile.

## Stockage et limites (important)
Clés localStorage : `cf.profiles`, `cf.session`, `cf.orders.<id>`, `cf.prefs.<id>`. Le mot de passe n'est jamais stocké en clair (SHA-256 avec sel), mais **ce n'est pas une authentification sécurisée** : toute personne ayant accès au navigateur peut lire ou modifier les données, et l'isolation par profil n'est qu'une commodité. Si l'API crypto est indisponible, la connexion se fait sans vérification de mot de passe. Pas de synchronisation, pas d'e-mail, pas de mot de passe oublié. Évitez d'y saisir des données personnelles sensibles.

## Avant une commercialisation
Backend, authentification réelle (ex. Supabase Auth), base de données avec règles d'accès par utilisateur, sauvegardes, hébergement, confidentialité, paiement.

## Monétisation (hypothèses à valider avec les commerçants)
Offre gratuite limitée ; Starter ≈ 3 000 FCFA/mois ; Business ≈ 7 500 FCFA/mois. Aucun revenu n'est garanti.