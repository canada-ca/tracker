## Guide de déploiement local

Le présent document a pour but d’illustrer de façon claire le déploiement d’une instance de cette application localement dans les premières entités.

### Configuration de l’environnement

#### Logiciels requis

À des fins de développement, il est recommandé d’installer [mongodb](https://www.mongodb.com/) et d’exécuter la base de données localement.
Cet utilitaire est rédigé pour **Python 3.6 et les versions suivantes**. pour faciliter la gestion des versions de Python. Quelle que soit la façon que vous choisissez, vous aurez besoin d’une installation de Python 3.6+ pour continuer.
Le projet utilise [MongoDB](https://www.mongodb.com/) comme étant son magasin de données. En fonction de votre plateforme, l’installation sera différente; veuillez suivre les directives d’installation qui se trouvent dans leur site pour installer MongoDB Community Server.

Une fois que MongoDB a été installé, nous devrons exécuter une instance de la base de données localement.
Pour ce faire, ouvrez une fenêtre de terminal et exécutez la commande suivante :

```bash
mongod &
```

Si vous obtenez une erreur liée au répertoire `/data/db`, en général cela signifie que vous devez créer ce répertoire. Si vous avez déjà créé le répertoire et obtenez encore une erreur, elle est probablement due au fait que l’utilisateur qui exécute la commande `mongod` doit être le propriétaire de ce répertoire.


#### Acquisition de la source

Le code source se trouve dans [GitHub](https://github.com/cds-snc/tracker). Vous devrez cloner ce référentiel dans un répertoire local.
```bash
git clone https://github.com/cds-snc/tracker.git
cd tracker
```

Vous devrez aussi télécharger le contenu du référentiel [domain-scan](https://github.com/cds-snc/domain-scan) également dans GitHub. Ce code est utilisé pour produire les résultats que le tableau de bord affiche.
```bash
git clone https://github.com/cds-snc/domain-scan.git
```

Gardez le terminal où vous exécutez ces commandes ouvert pour les étapes suivantes.

#### Environnement

Premièrement, vérifiez que vous avez la bonne version de Python.
```bash
python3 --version
```
Il doit indiquer quelque chose comme `Python 3.5.5`. Vous aurez besoin d’une version 3.6+.

Nous recommandons que les trousses de Python qui composent ce projet soient installées dans des environnements virtuels. Pour ce faire, exécutez les commandes suivantes.

```bash
cd tracker
python3 -m venv .env
. .env/bin/activate
pip3 install -e .
pip3 install -r domain-scan/requirements.txt
pip3 install -r domain-scan/requirements-scanners.txt
```

Les éléments de ce projet utilisent un certain nombre de variables d’environnement, mais il y en a quatre qui sont les plus communs :
* **DOMAIN_SCAN_PATH** (requis pour l’analyse) –Il s’agit du chemin d’accès vers l’emplacement du fichier `scan` dans le répertoire créé lorsque vous [avez téléchargé domain-scan](#Acquisition de la source)
* **DOMAIN_GATHER_PATH** (requis pour l’analyse) – Il s’agit du chemin d’accès vers l’emplacement du fichier `gather` dans le répertoire créé lorsque vous avez téléchargé [avez téléchargé domain-scan](#Acquisition de la source)
* **TRACKER_ENV** - Il s’agit d’un indicateur du mode d’exécution conseillé du site (qui touche sa configuration). Il a trois valeurs possibles :
  * **testing** (essais) - tente de se connecter à une base de données fonctionnant sur le port par défaut avec un nom de base de données aléatoire. On prévoit seulement utiliser cette valeur aux essais de l’application (et son utilisation est automatique).
  * **development** ( développement) (par défaut) – tente de se connecter à une base de données locale fonctionnant sur le port par défaut
  * **production** - tente de se connecter à une base de données indiquée par la variable d’environnement TRACKER_MONGO_URI
* **TRACKER_MONGO_URI** - La chaîne de connexion utilisée pour se connecter à la base de données lorsque le site fonctionne en production, et à laquelle le scanneur se connectera s’il n’est pas réglé manuellement.

```bash
export DOMAIN_SCAN_PATH=$(pwd)/domain-scan/scan
export DOMAIN_GATHER_PATH=$(pwd)/domain-scan/gather
export TRACKER_ENV=development
export TRACKER_MONGO_URI=mongodb://localhost:27017/track
```

### Initialisation des données

Pour lancer MongoDB avec certaines données que le tableau de bord affichera, nous devons exécuter une analyse sur certains domaines. Pour ce faire, il faudra deux listes, un des domaines parents (domaines de deuxième niveau) et un des sous-domaines. Exécutez les commandes suivantes pour générer un tout petit exemple de jeu.

```bash
mkdir csv
cat > ./csv/owners.csv << EOF
domain,filler,organization_en,organization_fr
canada.ca,,Employment and Social Development Canada,Famille,Enfants et Développement social
digital.canada.ca,,Treasury Board of Canada Secretariat,Secrétariat du Conseil du Trésor du Canada
numerique.canada.ca,,Treasury Board of Canada Secretariat,Secrétariat du Conseil du Trésor du Canada
EOF
cat > ./csv/domains.csv << EOF
domain
canada.ca
consultations-edsc.canada.ca
digital.canada.ca
numerique.canada.ca
2006census.gc.ca
EOF
cat > ./csv/ciphers.csv << EOF
cipher
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_ECDSA_WITH_AES_128_CCM
TLS_ECDHE_ECDSA_WITH_AES_256_CCM
TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256
TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384
TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256
TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384
TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
TLS_DHE_RSA_WITH_AES_128_GCM_SHA256
TLS_DHE_DSS_WITH_AES_128_GCM_SHA256
TLS_DHE_RSA_WITH_AES_256_GCM_SHA384
TLS_DHE_DSS_WITH_AES_256_GCM_SHA384
TLS_DHE_RSA_WITH_AES_128_CCM
TLS_DHE_RSA_WITH_AES_256_CCM
TLS_DHE_DSS_WITH_AES_128_CBC_SHA256
TLS_DHE_RSA_WITH_AES_128_CBC_SHA256
TLS_DHE_DSS_WITH_AES_256_CBC_SHA256
TLS_DHE_RSA_WITH_AES_256_CBC_SHA256
TLS_DHE_DSS_WITH_AES_128_CBC_SHA
TLS_DHE_RSA_WITH_AES_128_CBC_SHA
TLS_DHE_DSS_WITH_AES_256_CBC_SHA
TLS_DHE_RSA_WITH_AES_256_CBC_SHA
TLS_RSA_WITH_AES_128_GCM_SHA256
TLS_RSA_WITH_AES_256_GCM_SHA384
TLS_RSA_WITH_AES_128_CCM
TLS_RSA_WITH_AES_256_CCM
TLS_RSA_WITH_AES_128_CBC_SHA256
TLS_RSA_WITH_AES_256_CBC_SHA256
TLS_RSA_WITH_AES_128_CBC_SHA
TLS_RSA_WITH_AES_256_CBC_SHA
EOF
```

Une fois que ces listes sont en place, nous pouvons exécuter une analyse.
```bash
. .env/bin/activate
tracker run
```
Cela exécutera une analyse sur le contenu des fichiers `domains.csv` dans le répertoire `CSV`, vidant certains artefacts d’analyse dans le répertoire `data/output`, puis chargera les résultats dans la base de données.

### Exécution de l’appli

Maintenant que vous avez un jeu de données d’analyse prêt, allez au référentiel [track-web](https://github.com/cds-snc/track-web) pour terminer la configuration pour le tableau de bord! 
