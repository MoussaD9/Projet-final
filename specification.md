# Spécification — CommandeFacile

*Toutes vos commandes. Un espace clair. Zéro oubli.*

Document décrivant ce que le prototype fait **réellement** (version actuelle). Les éléments non implémentés sont listés au §12.

## 1. Vision

- **Produit** : application web de gestion de commandes pour petits commerçants (mode, chaussures, cosmétiques, accessoires), en priorité au Sénégal.
- **Problème** : les commandes arrivent par WhatsApp, Instagram, Facebook, téléphone ou en boutique, et s'éparpillent.
- **Langue / devise** : français, FCFA (XOF), dates au format français du navigateur.
- **Nature** : prototype front-end sans backend. Aucune clé API, aucune compilation.

## 2. Contraintes techniques

- HTML5 sémantique, CSS3, JavaScript ES6+ natifs. Aucun framework ni bibliothèque.
- Lancement : ouvrir `index.html`, ou Live Server dans VS Code.
- Persistance : `localStorage` uniquement.
- Contenu saisi par l'utilisateur affiché via `textContent` (pas d'`innerHTML`).

## 3. Structure du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Structure : écran d'authentification, application, dialogues |
| `style.css` | Design (variables CSS, thèmes sombre/clair), responsive |
| `script.js` | Données, comptes, rendu, validation, export |
| `README.md` | Présentation, tests manuels, limites |
| `spécification.md` | Ce document |

## 4. Comptes et profils (simulation locale)

**Avertissement** : ce n'est pas une authentification sécurisée. Toute personne ayant accès au navigateur peut lire ou modifier les données.

- **Inscription** : nom complet, boutique, e-mail, téléphone (obligatoires) ; ville, secteur ; mot de passe (6 caractères min.) + confirmation ; case de consentement au stockage local.
- **Validation** : champs requis, format d'e-mail, e-mail unique, confirmation identique. Erreurs affichées sous chaque champ.
- **Mot de passe** : jamais stocké en clair (SHA-256 avec sel via Web Crypto). Si l'API crypto est indisponible, la connexion se fait sans vérification du mot de passe.
- **Connexion** : e-mail + mot de passe. « Mot de passe oublié » : indiqué comme non disponible.
- **Mode démo** : bouton « Entrer dans la démo » (profil `demo`, sans mot de passe).
- **Déconnexion** : supprime uniquement la session active.
- **Mon profil** : modification de tous les champs + bio facultative ; Enregistrer / Annuler ; mise à jour immédiate du nom, de la boutique et des initiales (avatar) dans l'interface. Pas de photo.
- **Suppression du profil** : avec confirmation ; efface le profil, ses commandes et ses préférences.

## 5. Modèle de données

### Profil
`id`, `name`, `shop`, `email`, `phone`, `city`, `sector`, `bio`, `createdAt`, `salt`, `hash`.

### Commande
`id` (stable, ex. `CF-…`), `profileId`, `createdAt`, `client`, `phone`, `address`, `product`, `qty`, `price`, `ship`, `total`, `status`, `source`, `note`.

- **Total** : `total = price × qty + ship`, calculé automatiquement, en lecture seule dans le formulaire (aperçu en direct).
- **Statuts** : En attente, Confirmée, En livraison, Livrée, Annulée.
- **Sources** : WhatsApp, Instagram, Facebook, Téléphone, Boutique, Autre.
- **Secteurs** : Mode, Beauté/Cosmétiques, Accessoires, Alimentation, Électronique, Autre.

### Clés localStorage

| Clé | Contenu |
|---|---|
| `cf.profiles` | Liste des profils |
| `cf.session` | Identifiant du profil actif |
| `cf.orders.<id>` | Commandes du profil |
| `cf.prefs.<id>` | Préférences (thème) |

Un JSON absent ou invalide donne une liste vide sans faire planter l'application. Les erreurs d'écriture affichent un message d'erreur.

## 6. Règles de validation (commande)

- Client, téléphone, adresse/zone, produit : obligatoires.
- Quantité : entier ≥ 1.
- Prix unitaire : nombre ≥ 0, obligatoire.
- Frais de livraison : nombre ≥ 0 (vide = 0).

## 7. Indicateurs du tableau de bord

| Indicateur | Règle |
|---|---|
| Total commandes | Toutes les commandes du profil |
| En attente | Statut « En attente » |
| En cours | « Confirmée » + « En livraison » |
| Livrées | Statut « Livrée » |
| Chiffre d'affaires livré | Somme des totaux des commandes « Livrée » uniquement |
| À encaisser (non livrées) | Somme des totaux « En attente » + « Confirmée » + « En livraison » |

Les commandes « Annulée » ne comptent ni dans les livrées ni dans le chiffre d'affaires. Les valeurs sont recalculées après chaque ajout, modification, changement de statut ou suppression. Les cinq commandes les plus récentes sont listées ; un état vide propose de créer la première commande.

## 8. Gestion des commandes

- Créer, modifier (formulaire prérempli), annuler sans enregistrer, supprimer après confirmation, consulter les détails.
- Changement de statut direct depuis la liste.
- **Recherche** en temps réel (insensible à la casse) : client, téléphone, produit, zone de livraison, identifiant.
- **Filtre** par statut, **tri** par date (récentes / anciennes), bouton de réinitialisation.
- Message « Aucune commande ne correspond à votre recherche » si aucun résultat.
- Affichage en cartes empilées, sans débordement horizontal sur mobile.

## 9. WhatsApp

- Bouton « Contacter sur WhatsApp » dans la liste et dans les détails.
- URL `https://wa.me/<numéro>?text=<message>`, ouverte dans un nouvel onglet avec `noopener,noreferrer`.
- Numéro nettoyé (chiffres uniquement, 10 à 15 chiffres) ; aucun préfixe pays n'est deviné. Sinon : message d'aide (format international sans « + », ex. 221771234567).
- Message encodé avec `encodeURIComponent` : « Bonjour [nom], concernant votre commande de [produit], le montant total est de [total]. Le statut actuel de votre commande est : [statut]. Merci. »
- Aucun envoi automatique : l'utilisateur vérifie et envoie depuis WhatsApp.

## 10. Données et préférences

- Export JSON et CSV (UTF-8 avec BOM) des commandes du profil actif.
- Commandes d'exemple : ajoutées uniquement sur demande, avec confirmation, marquées « EXEMPLE ».
- Réinitialisation des commandes avec confirmation.
- Thème sombre (défaut) ou clair, conservé par profil.

## 11. Interface et accessibilité

- **Direction artistique** : fond bleu-noir, halos discrets, accent cyan/violet, cartes translucides, jetons CSS (`:root`) pour couleurs, rayons, durées.
- **Navigation** : barre latérale (Vue d'ensemble, Commandes, Mon profil, Paramètres) ; barre horizontale compacte sous 820 px ; menu d'avatar (profil, paramètres, déconnexion) fermé par Échap ou clic extérieur.
- **Responsive** : points de rupture à 1000 px et 820 px.
- **Accessibilité** : labels associés, focus visible, dialogues natifs `<dialog>` (fermeture avec Échap), toasts `aria-live`, statuts en texte (pas uniquement la couleur), `prefers-reduced-motion` respecté.

## 12. Limites connues et hors périmètre

- Authentification simulée, données lisibles localement, pas de synchronisation entre appareils.
- Pas de photo de profil, pas d'import de données, pas de page « Clients », pas de graphiques.
- Confirmations de suppression du profil et de réinitialisation via `confirm()` du navigateur.
- Pas de réinitialisation de mot de passe, pas d'envoi d'e-mail, pas d'intégration WhatsApp Business API, pas d'import automatique des messages.
- **Tests** : seule la syntaxe de `script.js` a été vérifiée. Les scénarios fonctionnels, mobile et clavier restent à valider manuellement (voir README).

## 13. Passage à un vrai SaaS

Backend et authentification réelle (ex. Supabase Auth), base de données avec règles d'accès par utilisateur, sauvegardes, hébergement, confidentialité des données personnelles, paiement.

## 14. Monétisation (hypothèses à valider)

Offre gratuite limitée ; Starter ≈ 3 000 FCFA/mois ; Business ≈ 7 500 FCFA/mois. Tarifs à tester auprès de vrais commerçants ; aucun revenu n'est garanti.