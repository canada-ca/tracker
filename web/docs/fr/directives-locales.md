## Guide de déploiement local

Le présent document a pour but d’illustrer de façon claire le déploiement d’une instance de cette appli localement dans les premières entités.

### Avant de commencer

Avant de commencer avec ces directives, nous vous recommandons de suivre les [edocuments équivalents ](https://github.com/cds-snc/tracker/blob/master/docs/local-instructions.md) pour le projet  [tracker](https://github.com/cds-snc/tracker). Cela vous permettra de remplir une base de données locale avec certaines données d’analyse que le tableau de bord affichera ensuite.

### Configuration de l’environnement

#### Logiciels requis

À des fins de développement, il est recommandé d’installer MongoDB et d’exécuter la base de données localement.
Ce tableau de bord est une application [Flask](http://flask.pocoo.org/) édigée pour **Python 3.5 et versions suivantes**. Nous recommandons [pyenv](https://github.com/pyenv/pyenv) pour faciliter la gestion des versions de Python. Quelle que soit la façon que vous choisissez, vous aurez besoin d’une installation de Python 3.5+ pour continuer.
Le projet utilise [MongoDB](https://www.mongodb.com/) comme étant son magasin de données. En fonction de votre plateforme, l’installation sera différente; veuillez suivre les directives d’installation qui se trouvent sur leur site pour installer MongoDB Community Server.

Une fois que MongoDB a été installé, nous devrons exécuter une instance de la base de données localement.
Pour ce faire, ouvrez une fenêtre de terminal et exécutez la commande suivante :

```bash
mongod &
```

Si vous obtenez une erreur liée au répertoire `/data/db`, en général cela signifie que vous devez créer ce répertoire. Si vous avez déjà créé le répertoire et obtenez encore une erreur, elle est probablement due au fait que l’utilisateur qui exécute la commande `mongod` doit être le propriétaire de ce répertoire.

#### Acquisition de la source

Le code source se trouve dans [GitHub](https://github.com/cds-snc/track-web). YVous devrez cloner ce référentiel dans un répertoire local.
```bash
git clone https://github.com/cds-snc/track-web.git
```

Gardez le terminal où vous exécutez ces commandes ouvert pour les étapes suivantes.

#### Environnement

Premièrement, vérifiez que vous avez la bonne version de Python.
```bash
python3 --version
```
Il doit indiquer quelque chose comme `Python 3.5.5`. Vous aurez besoin d’une version 3.5+.

Nous recommandons à ce que les trousses de Python qui composent ce projet soient installées dans des environnements virtuels. Pour ce faire, exécutez les commandes suivantes.
```bash
python3 -m venv .env
. .env/bin/activate
pip3 install -e .
```

### Exécution de l’application

À l’approche de la ligne d’arrivée, tout ce qu’il reste à faire est de lancer le site.
```bash
python3 track/wsgi.py
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 258-029-594
```
Cela devrait suffire! Visitez `http://127.0.0.1:5000/` dans votre navigateur pour voir le site déployé localement.
