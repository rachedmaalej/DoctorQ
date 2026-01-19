# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Switch to Arabic" [ref=e5] [cursor=pointer]: عربي
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e10]: local_hospital
      - heading "Rejoignez le Saf" [level=1] [ref=e11]
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: phone
          - text: Téléphone *
        - textbox "phone Téléphone *" [ref=e16]:
          - /placeholder: +216 XX XXX XXX
          - text: "+216"
        - paragraph [ref=e17]:
          - generic [ref=e18]: info
          - text: "Format: +216 XX XXX XXX"
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: person
          - text: Votre nom
          - generic [ref=e22]: (optionnel)
        - textbox "person Votre nom (optionnel)" [ref=e23]:
          - /placeholder: Comment vous appelez-vous?
      - button "confirmation_number Prendre ma place" [ref=e24] [cursor=pointer]:
        - generic [ref=e25]: confirmation_number
        - text: Prendre ma place
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]: lock
          - text: Vos informations restent privées
        - generic [ref=e29]:
          - generic [ref=e30]: notifications_active
          - text: Suivez votre position en temps réel sur cette page
```