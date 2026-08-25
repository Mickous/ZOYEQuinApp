# ZOYEQuinApp V2 — Architecture cible

## Objectif

Construire une application mobile-first, offline-first et modulaire dont les règles métier ne dépendent pas de l’interface.

## Flux général

```text
Page / Component
      ↓
Use Case / Service métier
      ↓
Validation
      ↓
Repository
      ↓
IndexedDB
```

Les composants UI ne doivent pas appeler directement `localStorage` ou IndexedDB.

## Modules métier

```text
sales
inventory
customers
credits
reservations
expenses
purchases
reports
settings
backup
```

## Règle stock

Toute modification de quantité doit passer par `inventoryService` et créer un `StockMovement`.

Exemple :

```text
createSale()
  → validateSale()
  → createSaleRecord()
  → createPayment()
  → decreaseStock()
  → createStockMovements()
  → persistTransaction()
```

## Règle financière

Une `SaleItem` conserve les valeurs historiques nécessaires :

```text
unitSellingPrice
unitCostPrice
quantity
subtotal
margin
```

Le changement ultérieur du prix produit ne modifie donc jamais les anciennes ventes.

## Transactions

Les opérations multi-étapes doivent être regroupées dans une transaction IndexedDB lorsque possible, afin d’éviter une vente enregistrée sans mouvement de stock ou un mouvement de stock sans vente.

## Identifiants

Les identifiants doivent être uniques et indépendants du nom affiché.

## Suppression

Les entités métier importantes utilisent de préférence un statut `active/inactive` ou un mécanisme d’annulation. L’historique financier et stock ne doit pas être effacé par une suppression utilisateur ordinaire.

## Versionnement des données

Le schéma local doit avoir un numéro de version. Toute évolution de structure doit avoir une migration explicite.

## PWA

Les assets applicatifs, manifest et service worker doivent être gérés comme des fichiers du projet et versionnés dans Git.
