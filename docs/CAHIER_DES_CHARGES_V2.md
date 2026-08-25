# ZOYEQuinApp V2 — Cahier des charges

## 1. Vision

ZOYEQuinApp est une application de gestion simple, mobile-first et offline-first destinée aux petites quincailleries et commerces de proximité en Côte d’Ivoire et, plus largement, en Afrique de l’Ouest.

Objectif : permettre au commerçant de gérer ventes, caisse, stock, clients, crédits, réservations, dépenses et rapports sans dépendre d’un serveur ou d’une connexion permanente.

La V2 doit privilégier la fiabilité des données, la simplicité d’utilisation, la traçabilité et la capacité d’évolution.

## 2. Principes non négociables

- Mobile-first.
- Fonctionnement hors ligne.
- Données stockées localement sur l’appareil.
- Aucune suppression destructive des données métier importantes.
- Toute opération financière ou de stock doit être traçable.
- Les calculs financiers doivent être déterministes et basés sur les données enregistrées au moment de l’opération.
- Interface simple pour un utilisateur non technique.
- Architecture modulaire.
- Séparation entre interface, logique métier et persistance.
- Export et restauration des données.
- Aucun changement direct de `main` pendant la refonte.

## 3. Modules V2

### 3.1 Dashboard

Afficher :
- chiffre d’affaires ;
- encaissements réels ;
- coût des marchandises vendues ;
- marge brute ;
- dépenses ;
- bénéfice net estimé ;
- créances clients ;
- valeur du stock ;
- produits sous seuil ;
- ventes du jour ;
- dépenses du jour ;
- meilleures ventes.

Le dashboard doit permettre de choisir une période : aujourd’hui, 7 jours, mois, période personnalisée, historique.

### 3.2 Caisse / Ventes

Fonctions :
- recherche produit ;
- sélection rapide ;
- panier ;
- modification des quantités ;
- contrôle du stock disponible ;
- vente comptant ;
- vente à crédit ;
- paiement partiel ;
- vente globale rapide ;
- sélection/création client ;
- reçu ;
- impression ;
- partage WhatsApp ;
- annulation contrôlée d’une transaction.

Chaque vente doit conserver un snapshot du prix de vente et du coût d’achat utilisé pour le calcul de marge au moment de la vente.

### 3.3 Produits

Un produit doit prévoir au minimum :
- id ;
- nom ;
- SKU/référence ;
- code-barres optionnel ;
- catégorie ;
- unité ;
- prix d’achat actuel ;
- prix de vente actuel ;
- quantité disponible ;
- seuil minimum ;
- fournisseur optionnel ;
- statut actif/inactif ;
- date de création ;
- date de modification.

### 3.4 Stock

Le stock ne doit plus être uniquement un champ `qty` modifié directement.

Créer un journal `StockMovement` :
- entrée ;
- sortie ;
- ajustement ;
- retour ;
- correction.

Chaque mouvement contient : produit, quantité, type, raison, référence de l’opération, date.

Le stock courant doit être cohérent avec les mouvements et contrôlable.

### 3.5 Clients

Créer un vrai module client :
- nom ;
- téléphone ;
- adresse optionnelle ;
- notes ;
- date de création ;
- statut actif/inactif.

Afficher :
- historique d’achats ;
- total acheté ;
- total payé ;
- dette restante ;
- réservations ;
- paiements.

### 3.6 Crédits / Dettes

Ne plus considérer une dette comme une simple propriété isolée d’une vente.

Le système doit gérer :
- créance ;
- paiement ;
- solde ;
- historique des paiements ;
- client concerné ;
- échéance optionnelle ;
- statut : ouverte, partiellement réglée, réglée.

Un client peut avoir plusieurs dettes simultanément.

### 3.7 Réservations

Une réservation doit référencer de vrais produits lorsque ceux-ci sont connus.

Structure logique :
- client ;
- lignes de produits ;
- quantité ;
- prix réservé ;
- total ;
- acompte ;
- solde ;
- statut ;
- date ;
- date prévue ;
- notes.

Statuts : en attente, confirmée, partiellement payée, prête, livrée, annulée.

La livraison doit convertir proprement la réservation en opération de vente et déclencher les mouvements de stock appropriés.

### 3.8 Dépenses

Une dépense contient :
- catégorie ;
- montant ;
- description ;
- date ;
- mode de paiement ;
- note éventuelle.

Catégories initiales : transport, électricité, loyer, salaire, communication, entretien, frais bancaires, autre.

### 3.9 Approvisionnements / Fournisseurs

Prévoir l’architecture même si le module complet peut être livré après le MVP.

Un approvisionnement doit pouvoir :
- identifier un fournisseur ;
- enregistrer des produits ;
- enregistrer les quantités ;
- enregistrer le coût d’achat ;
- augmenter le stock ;
- créer les mouvements de stock correspondants.

### 3.10 Rapports

Rapports minimum :
- ventes par période ;
- bénéfice/marge ;
- dépenses ;
- produits les plus vendus ;
- stock faible ;
- mouvements de stock ;
- crédits clients ;
- encaissements ;
- réservations.

Export CSV/Excel-compatible et JSON de sauvegarde.

### 3.11 Paramètres et sauvegarde

Fonctions :
- identité de la boutique ;
- devise ;
- format du reçu ;
- seuils par défaut ;
- export complet ;
- import/restauration ;
- réinitialisation avec confirmation forte ;
- informations de version ;
- diagnostic du stockage local.

## 4. Modèle de données cible

Entités principales :

```text
Product
Category
Customer
Supplier
Sale
SaleItem
Payment
CreditAccount
CreditPayment
Reservation
ReservationItem
Expense
StockMovement
AppSettings
AuditEvent
```

Relations principales :

```text
Customer 1 ─── N Sale
Sale 1 ─── N SaleItem
Product 1 ─── N SaleItem
Sale 1 ─── N Payment
Customer 1 ─── N CreditAccount
CreditAccount 1 ─── N CreditPayment
Customer 1 ─── N Reservation
Reservation 1 ─── N ReservationItem
Product 1 ─── N StockMovement
Supplier 1 ─── N Purchase
Purchase 1 ─── N PurchaseItem
```

## 5. Règles financières

Une vente doit conserver :
- prix de vente appliqué ;
- coût d’achat retenu au moment de la vente ;
- quantité ;
- marge de la ligne.

Ne jamais recalculer l’ancienne marge à partir du prix d’achat actuel d’un produit.

Formules :

```text
Chiffre d’affaires = somme des ventes
Coût des marchandises vendues = somme(snapshot coût × quantité)
Marge brute = chiffre d’affaires - coût des marchandises vendues
Bénéfice net = marge brute - dépenses
Créances = sommes restant dues
```

Les remboursements/annulations doivent générer des opérations inverses traçables et ne doivent pas simplement effacer l’historique.

## 6. Persistance

La V2 doit évoluer de `localStorage` vers IndexedDB.

Le stockage doit être encapsulé derrière un service, afin que l’interface ne connaisse jamais directement IndexedDB.

Exemple :

```text
UI
 ↓
Services métier
 ↓
Repository
 ↓
IndexedDB
```

Une couche de migration doit permettre de récupérer les données de la V1 si cela est techniquement possible et sûr.

## 7. Architecture applicative

Structure cible indicative :

```text
src/
├── app/
├── components/
├── pages/
│   ├── dashboard/
│   ├── pos/
│   ├── products/
│   ├── inventory/
│   ├── customers/
│   ├── credits/
│   ├── reservations/
│   ├── expenses/
│   ├── reports/
│   └── settings/
├── services/
├── repositories/
├── database/
├── models/
├── validators/
├── utils/
└── styles/
```

L’implémentation pourra utiliser React + Vite et TypeScript si le choix est confirmé pendant la phase technique.

## 8. PWA / Offline

La V2 doit disposer de vrais fichiers :
- `manifest.json` ;
- service worker ;
- icônes locales ;
- assets versionnés.

Les dépendances critiques ne doivent pas dépendre d’un CDN pour fonctionner.

## 9. UX

Priorités :
1. vitesse ;
2. lisibilité ;
3. actions évidentes ;
4. peu de saisie ;
5. fonctionnement au téléphone ;
6. feedback immédiat ;
7. prévention des erreurs.

Les actions critiques doivent demander confirmation : suppression logique, annulation, restauration et réinitialisation.

## 10. Sécurité et intégrité

Même sans serveur :
- validation des entrées ;
- échappement des données affichées ;
- contrôle des quantités ;
- contrôle des montants ;
- prévention des doublons lors des opérations critiques ;
- sauvegarde avant restauration ;
- versionnement du schéma local.

## 11. Migration V1 → V2

La V1 ne sera pas écrasée.

Étapes :
1. conserver `main` intact ;
2. construire la V2 dans `refactor/v2-architecture` ;
3. définir le schéma V2 ;
4. écrire un importateur V1 ;
5. tester la migration sur copie ;
6. vérifier les totaux ;
7. seulement ensuite connecter l’ancienne base à la nouvelle application.

## 12. Ordre de développement

### Phase 0 — Fondation
- structure projet ;
- tooling ;
- conventions ;
- modèles ;
- IndexedDB ;
- repository ;
- validation ;
- PWA.

### Phase 1 — Produits et stock
- produits ;
- catégories ;
- mouvements ;
- inventaire ;
- alertes.

### Phase 2 — Caisse
- catalogue ;
- panier ;
- ventes ;
- paiements ;
- reçu ;
- vente globale.

### Phase 3 — Clients et crédits
- clients ;
- comptes clients ;
- crédits ;
- remboursements ;
- historique.

### Phase 4 — Dépenses et dashboard
- dépenses ;
- marge ;
- bénéfice ;
- indicateurs ;
- graphiques.

### Phase 5 — Réservations
- réservations structurées ;
- acomptes ;
- livraison ;
- conversion en vente.

### Phase 6 — Sauvegarde et rapports
- export ;
- import ;
- restauration ;
- rapports ;
- diagnostic.

### Phase 7 — Approvisionnement
- fournisseurs ;
- achats ;
- entrées de stock ;
- historique des coûts.

## 13. Ce qui est conservé de la V1

- identité visuelle générale ;
- dashboard comme point d’entrée ;
- caisse ;
- catalogue produit ;
- crédits ;
- réservations ;
- dépenses ;
- reçu ;
- impression ;
- partage WhatsApp ;
- point global ;
- fonctionnement local.

## 14. Ce qui est refait

- architecture complète ;
- stockage ;
- modèle produit ;
- modèle vente ;
- gestion du stock ;
- calcul de marge ;
- crédits ;
- réservations ;
- navigation ;
- PWA ;
- sauvegarde/restauration ;
- validations ;
- rapports.

## 15. Ce qui est supprimé

- monolithe `index.html` ;
- dépendance critique aux CDN ;
- service worker injecté dynamiquement ;
- suppression physique des produits métier ;
- réservation représentée uniquement par une description libre lorsqu’un produit réel est disponible ;
- recalcul historique des coûts à partir du prix actuel du produit.

## 16. Critères d’acceptation V2

La V2 sera considérée comme prête pour une première mise en production lorsque :

- une vente comptant fonctionne hors ligne ;
- une vente à crédit fonctionne ;
- un remboursement fonctionne ;
- le stock est correctement décrémenté ;
- chaque mouvement de stock est traçable ;
- une dépense modifie correctement le résultat ;
- les anciennes ventes conservent leur coût historique ;
- une réservation peut être livrée proprement ;
- les données survivent au rechargement et au redémarrage ;
- un export complet peut être restauré ;
- aucune opération critique ne détruit silencieusement l’historique ;
- l’application fonctionne sans Internet après installation des assets ;
- les fonctionnalités principales sont utilisables sur écran mobile.

## 17. Hors périmètre initial

Pour éviter de transformer le projet en ERP trop tôt :
- synchronisation cloud ;
- multi-appareils ;
- comptes utilisateurs complexes ;
- comptabilité réglementaire complète ;
- paiement mobile intégré ;
- IA ;
- marketplace ;
- gestion multi-boutiques.

Ces fonctionnalités pourront être ajoutées après stabilisation du cœur de l’application.
