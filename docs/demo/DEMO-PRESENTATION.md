# DoctorQ v0.5.1 - Présentation Démo pour Dr. Skander Kamoun

## Aperçu de la Démo
Une démonstration convaincante de 12-15 minutes montrant la proposition de valeur de DoctorQ : éliminer l'anxiété des patients en salle d'attente et optimiser le flux de la clinique.

**Version:** 0.5.1 (Release Pilote)
**Date de la Démo:** 20 janvier 2026

---

## Préparation Pré-Démo (5 min avant)

### Appareils Requis
- **iPad Mini** → Tableau de bord médecin (`https://doctor-q-web.vercel.app`)
- **Téléphone** → Vue patient (pour scanner le QR / check-in)

### Checklist
- [ ] Connexion avec `dr.skander@example.tn` / `password123`
- [ ] Vider la file existante ("Vider la file")
- [ ] Désactiver "Docteur présent" initialement
- [ ] Les deux appareils sur une connexion internet stable
- [ ] Tester que l'API répond : `https://doctorqapi-production-84e9.up.railway.app/health`

### URLs Clés
- **Frontend:** `https://doctor-q-web.vercel.app`
- **Page Check-in:** `https://doctor-q-web.vercel.app/checkin/7d4e22cd-4604-4a72-b624-7b718885b663`
- **API Health:** `https://doctorqapi-production-84e9.up.railway.app/health`

---

## Acte 1 : Le Problème (1 min)
*Ne pas montrer l'app encore - peindre la douleur*

> "Vos patients ont un rendez-vous pour un jour, pas une heure. Ils arrivent, s'assoient 1 à 3 heures sans visibilité. Ils sont anxieux, frustrés, ne peuvent pas planifier leur journée. Vous finissez par traiter des patients stressés."

---

## Acte 2 : Le Centre de Commande du Médecin (4 min)

### Scène 1 : Tableau de Bord Vide
- Montrer l'interface épurée
- Pointer les **4 cartes statistiques** :
  - En Attente
  - Vus Aujourd'hui
  - Attente moyenne
  - Attente max
- Mettre en avant le QR code : *"C'est tout ce dont vous avez besoin à la réception"*

### Scène 2 : Remplir la File
- Cliquer sur **"Remplir (Démo)"** → 10 patients apparaissent instantanément
- Montrer les noms tunisiens réalistes avec un mix de rendez-vous et sans rendez-vous

### Scène 3 : Gestion de la File
- **Réorganiser** : Utiliser les flèches haut/bas pour changer l'ordre
- **Urgence** : Bouton rouge → le patient passe en #1 avec notification toast
- **Supprimer** : X pour retirer un patient absent
- **Ajouter manuellement** : Montrer le formulaire pour l'usage de la secrétaire

### Scène 4 : Présence du Médecin
- Activer **"Docteur présent"** (vert)
- *"Quand vous partez pour le déjeuner ou la prière, désactivez - les patients le savent instantanément"*

### Scène 5 : Appeler le Suivant
- Cliquer sur le gros bouton **"Suivant"**
- Le patient passe en "En Consultation"
- *"Le patient #2 reçoit automatiquement une notification qu'il est presque à son tour"*

---

## Acte 3 : La Magie Côté Patient (5 min)
*C'est le moment "wow" - utiliser le téléphone*

### Scène 1 : Check-in par QR Code
- Scanner le QR code depuis le tableau de bord (ou ouvrir le lien check-in)
- Montrer la page de check-in épurée avec le préfixe `+216`
- Entrer : `+216 55 123 456`, nom : "Patient Démo"
- Soumettre → transition fluide vers la page de statut

### Scène 2 : La Nouvelle Expérience Patient
- **Visuel du parcours** : Icône patient → chaises (personnes devant) → porte
- **Ticket compact** : Carré épuré avec `#X` et dégradé coloré selon la position
- **Carte attente estimée** : Affiche `~XX min` à côté du ticket
- **Anecdotes "Le saviez-vous ?"** : Carte avec faits sur les yeux qui change toutes les 18 secondes avec cercle de progression
- *"50 anecdotes intéressantes sur les yeux pour divertir les patients pendant l'attente"*

### Scène 3 : Synchronisation Temps Réel (LE MOMENT WOW)
- Retourner sur l'iPad → Cliquer **"Suivant"**
- Regarder le téléphone : la position se met à jour instantanément, toast "Vous avez avancé !"
- Répéter 2-3 fois - la synchronisation temps réel est magique

### Scène 4 : Position #1 - Vous êtes le Prochain
- Quand le patient atteint #1 :
  - Le ticket **se centre à l'écran** (plus besoin de l'estimation d'attente)
  - Couleur verte
  - Message urgent : *"Présentez-vous à l'accueil"*

### Scène 5 : Votre Tour - Confettis !
- Appeler le patient démo
- **ANIMATION CONFETTIS**
- Écran vert "C'est votre tour !"
- *"La célébration rend l'expérience mémorable"*

---

## Acte 4 : Fin de Journée (1 min)
*Nouvelle fonctionnalité à montrer*

### Scène : Dernier Patient
- Vider la file, ajouter 1 patient, l'appeler en consultation
- Montrer que la carte "En Consultation" a maintenant :
  - Label **(Dernier patient)**
  - **Icône coche** au lieu de "ouvrir dans un nouvel onglet"
- Cliquer sur la coche → consultation terminée → file vide
- *"Un clic pour clôturer la journée"*

---

## Acte 5 : Médecin Absent (1 min)

- Désactiver **"Docteur présent"**
- Basculer sur le téléphone patient → bannière d'avertissement apparaît immédiatement
- *"Les patients savent que vous êtes absent - pas de frustration, pas de déplacement inutile"*

---

## Acte 6 : Le Pitch (1 min)

### Pour Vous (le Médecin) :
- Voir votre file d'un coup d'œil
- Appel des patients en un clic
- Gérer les urgences et les absents
- Fonctionne sur ordinateur, tablette, téléphone

### Pour Vos Patients :
- Pas d'application à installer - juste scanner le QR
- Suivi de position en temps réel
- Peuvent attendre au café, dans leur voiture, chez eux
- Arrivent pile à l'heure

### Pour Votre Cabinet :
- Patients plus heureux = meilleurs avis
- Flux plus efficace
- Image moderne et professionnelle

**Prix :** 50 TND/mois (~16 USD) - *Premier mois gratuit en tant que pilote*

---

## Schéma du Flux de Démo

```
iPad (MÉDECIN)                   Téléphone (PATIENT)
─────────────────────────────────────────────────────
1. Connexion
2. Montrer tableau de bord vide
3. "Remplir" → 10 patients
4. Démo réorganiser/urgence/supprimer
5. Activer "Docteur présent"
6. "Suivant" (appeler #1)
                                 7. Scanner QR → Check-in
                                 8. Voir page de statut avec :
                                    - Visuel du parcours
                                    - Ticket compact + temps d'attente
                                    - Anecdotes avec timer
9. "Suivant" ──────────────────► Position se met à jour en direct !
10. Continuer à appeler... ────► Regarder la position diminuer
11. Appeler le patient démo ───► CONFETTIS !
12. Montrer le flux "dernier patient"
13. Désactiver "Docteur présent" ► Bannière d'avertissement apparaît
```

---

## Réponses aux Objections

| Objection | Réponse |
|-----------|---------|
| "Et si internet tombe ?" | Les patients peuvent toujours venir normalement - ça ajoute de la valeur, ça ne remplace rien |
| "Mes patients sont âgés" | La secrétaire les ajoute manuellement, ils attendent comme d'habitude |
| "Et les rendez-vous ?" | Optionnel - on gère les deux : avec et sans rendez-vous |
| "Les SMS coûtent cher ?" | Inclus dans les 50 TND - on gère tout |

---

## Plans de Secours

| Problème | Solution |
|----------|----------|
| API down | Montrer des captures d'écran, expliquer le flux |
| Socket ne synchronise pas | Rafraîchir la page patient manuellement |
| "Remplir" échoue | Ajouter 2-3 patients manuellement |

---

## Limitations Connues (v0.5.1)

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Notifications SMS | Pas encore actif | Sera activé après le pilote |
| Intégration WhatsApp | Planifié | Fonctionnalité Phase 2 |
| Multi-langue | Français + Arabe | RTL supporté |
| Tableau de bord admin | Interne seulement | Disponible sur `/admin` |

---

## Points Forts à Mettre en Avant

1. **Design du ticket compact** - plus épuré, plus professionnel
2. **Anecdotes avec timer de progression** - patients divertis pendant l'attente
3. **Bouton "Terminer consultation"** - flux de fin de journée facile
4. **Ticket centré en position #1** - focus visuel quand ça compte
5. **Synchronisation temps réel** - le moment "wow" de la démo

---

## Suites Après la Démo

Si Dr. Kamoun approuve :
1. **Mise en production :** Mercredi 21 ou Jeudi 22 janvier
2. **Configuration nécessaire :**
   - Créer son vrai compte cabinet (nouvel email)
   - Imprimer une affiche QR code pour la réception
   - Briefing de 5 minutes pour la secrétaire
3. **Premier mois gratuit** en tant que partenaire pilote

---

## Identifiants de Test

- **Email:** `dr.skander@example.tn`
- **Mot de passe:** `password123`
- **Nom du cabinet:** Cabinet Dr Skander Kamoun

## Vérification Rapide (avant la démo)

```bash
# Vérifier que l'API est up
curl https://doctorqapi-production-84e9.up.railway.app/health

# Tester la connexion (devrait retourner un token)
curl -X POST https://doctorqapi-production-84e9.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.skander@example.tn","password":"password123"}'
```
