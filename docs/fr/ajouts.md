## Faire des ajouts

Le présent document a pour but de donner une explication de l’emplacement des diverses composantes du système, et la façon dont on pourrait les modifier ou y effectuer des ajouts.

Cet utilitaire est une application Python 3 qui fait appel à une autre application Python  [domain-scan](https://github.com/cds-snc/domain-scan) rédigée par [18F](https://github.com/18F).

L’analyse des domaines est répartie en deux parties : l’analyse même et le traitement des résultats. La gestion de l’analyse et le traitement des données se trouvent dans le répertoire `data`.

* `cli.py` - définition CLI, la façon prévue d’interagir avec le module de suivi comme une application.
* `env.py` - module pour traiter la lecture et l’analyse de la configuration environnementale. À mesure que la refactorisation avance, on espère que ce fichier soit entièrement supprimé puisqu’il crée des obstacles dans la découverte de certaines valeurs importantes qui sont définies dans le reste du code.
* `logger.py` - module contenant un code simple pour faciliter la journalisation.
* `models.py` - couche d’abstraction au-dessus de MongoDB. Ce module ne fournit pas un volume élevé d’abstraction, juste assez pour découpler l’application du choix de MongoDB, particulièrement si, plus tard, on a décidé de passer à un autre magasin de données; les changements au scanneur pourraient être isolés de ce module.
* `preprocess.py` - module pour gérer les tâches que l’on devrait peut-être effectuer avant le processus d’analyse.
* `processing.py` - module pour gérer l’interprétation et l’analyse des résultats de l’analyse.
* `update.py` - module pour gérer la coordination de `domain-scan`.

#### Le processus d’analyse

L’analyse est effectuée par [domain-scan](https://github.com/18F/domain-scan), au moyen d’un sous-ensemble de ses capacités, à savoir les scanneurs [pshtt](https://github.com/dhs-ncats/pshtt) et [sslyze](https://github.com/nabla-c0d3/sslyze).  
Le module `update.py` lance l’analyse. Malheureusement, puisque `domain-scan` a été rédigé comme une application réservée et pas une bibliothèque aux fins de réutilisation, le module `update` recoure à l’élaboration de commandes de ligne de commande et à leur exécution avec le module `subprocess`.

#### Analyse des résultats

Une fois l’analyse terminée, le module `processing.py` est chargé de lire les résultats de l’analyse, d’effectuer une certaine interprétation et, enfin, de télécharger les résultats pertinents dans la base de données.
