[![CircleCI](https://circleci.com/gh/cds-snc/track-web.svg?style=svg)](https://circleci.com/gh/cds-snc/track-web)
[![Known Vulnerabilities](https://snyk.io/test/github/cds-snc/track-web/badge.svg)](https://snyk.io/test/github/cds-snc/track-web)

[La version française suit.](#---------------------------------------------------------------------)

## Track Government of Canada domains' adherence to web security practices

This repository is one component of _Track web security compliance_, a web-based application that scans Government of Canada websites and reports how they are meeting good web security practices, as outlined in [Information Technology Policy Implementation Notice (ITPIN): Implementing HTTPS for Secure Web Connections](https://www.canada.ca/en/treasury-board-secretariat/services/information-technology/policy-implementation-notices.html). `track-web` is a web application that displays the results of [tracker](https://github.com/cds-snc/tracker), the domain scanner.

This is what it looks like with demo data:

|         | 
|---------|
|![English landing page: header with title, some text, and a chart showing number of domains that enforce HTTPS](/docs/img/en-landing.png)  |  
|![English dashboard page: text, a search bar, and a table with columns: Organization, ITPIN Compliant, Enforces HTTPS, HSTS, Free of known weak protocols and ciphers, Uses approved certificates](/docs/img/en-dashboard.png) | 



-------

| Documentation                                           |
| ------------------------------------------------------- |
| [Development Setup Instructions](#development-setup)    |
| [Local Deploy Step-by-step](docs/en/local-instructions.md) |

## Developer Notes

This repository is using [snyk](https://snyk.io/org/cds-snc) to scan our dependencies for vulnerabilities.  
Unfortunately Synk lacks the ability to detect the dependencies listed in the `setup.py` file.
To get around this we are have the dependencies synced between the `setup.py` and `requirements.txt` (which snyk can scan) files.  
If you are developing this and add an additional dependency, make sure to add it to both locations

## Development Setup

For development purposes it is recommended that you install [MongoDB](https://www.mongodb.com/) and run the database locally.

This dashboard is a [Flask](http://flask.pocoo.org/) app written for **Python 3.5 and up**. We recommend [pyenv](https://github.com/yyuu/pyenv) for easy Python version management.

To setup local python dependencies, you can run `make setup` from the root of the repository. We recommend that this is done from within a virtual environment

To prepare data for presentation, please see the [tracker](https://github.com/cds-snc/tracker) repository.

* Install dependencies:

```bash
pip install -r requirements.txt
```

* If developing this dashboard app, you will also need the development requirements
```bash
pip install .[development]
```

* If developing the stylesheets, you will also need [Sass](http://sass-lang.com/), [Bourbon](http://bourbon.io/), [Neat](http://neat.bourbon.io/), and [Bitters](http://bitters.bourbon.io/).

```bash
gem install sass bourbon neat bitters
```

* If editing styles during development, keep the Sass auto-compiling with:

```bash
make watch
```

* And to run the app in development, use:

```bash
make debug
```

This will run the app with `DEBUG` mode on, showing full error messages in-browser when they occur.

When running in development mode it is expected that you have a database running locally, accessible via `localhost:27017`.

To produce some data for the Flask app to display, follow the instructions in [tracker](https://github.com/cds-snc/tracker).

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.

### Origin

This project was originally forked from [18F](https://github.com/18f/pulse) and has been modified to fit the Canadian context.

## ---------------------------------------------------------------------

## Faire le suivi du respect des pratiques en matière de sécurité Web par les domaines du gouvernement du Canada

Ce dépôt est l’un des éléments du _Suivre la conformité en matière de sécurité Web_, une application Web qui analyse les sites Web du gouvernement du Canada et indique en quoi ils respectent les bonnes pratiques en matière de sécurité Web, comme l’énonce l'[Avis de mise en œuvre de la Politique sur la technologie de l’information (AMPTI) : Mise en œuvre de HTTPS pour les connexions Web sécurisées](https://www.canada.ca/fr/secretariat-conseil-tresor/services/technologie-information/avis-mise-oeuvre-politique.html). `track-web` est une application Web qui affiche les résultats du  [tracker](https://github.com/cds-snc/tracker), l’analyseur de domaines.

Voici à quoi cela ressemble avec les données de démonstration :

|         |
|---------|
|![French landing page: header with title, some text, and a chart showing number of domains that enforce HTTPS](/docs/img/fr-landing.png) |
|![French dashboard page: text, a search bar, and a table with columns: Organization, ITPIN Compliant, Enforces HTTPS, HSTS, Free of known weak protocols and ciphers, Uses approved certificates](/docs/img/fr-dashboard.png) |



-------

| Documentation                                           |
| ------------------------------------------------------- |
| [Instructions de configuration du développement](#configuration-du-développement)    |
| [Déploiement local étape par étape](docs/fr/directives-locales.md) |

## Remarques à l’intention des développeurs

Ce dépôt utilise [snyk](https://snyk.io/org/cds-snc) pour analyser nos dépendances à l’égard des vulnérabilités.
Malheureusement, Snyk ne peut pas déceler les dépendances énumérées dans le fichier `setup.py`. Pour contourner ce problème, nous avons synchronisé les dépendances entre les fichiers `setup.py` et `requirements.txt` (que Snyk peut numériser).
Si vous procédez au développement et ajoutez une dépendance supplémentaire, vous devez veiller à l’ajouter aux deux emplacements.


## Configuration du développement

À des fins de développement, il vous est recommandé d’installer [MongoDB](https://www.mongodb.com/) et d’exécuter la base de données localement.

Ce tableau de bord est une application [Flask](http://flask.pocoo.org/) écrite pour **Python 3.5 et les versions subséquentes**. Nous recommandons [pyenv](https://github.com/yyuu/pyenv) pour une gestion facile des versions de Python.

Pour configurer les dépendances locales de Python, vous pouvez exécuter `make setup` à partir de la racine du dépôt. Nous recommandons que cela soit fait dans un environnement virtuel.

Pour préparer les données en vue de la présentation, veuillez consulter le répertoire  [tracker](https://github.com/cds-snc/tracker).

* Installer les dépendances :

```bash
pip install -r requirements.txt
```

* Si vous développez cette application de tableau de bord, vous aurez aussi besoin des exigences de développement.

```bash
pip install .[development]
```

* Si vous développez les feuilles de style, vous aurez aussi besoin de [Sass](http://sass-lang.com/), [Bourbon](http://bourbon.io/), [Neat](http://neat.bourbon.io/), et [Bitters](http://bitters.bourbon.io/).

```bash
gem install sass bourbon neat bitters
```

* Si vous modifiez des styles pendant le développement, veillez à exécuter la fonction d’autocompilation de Sass avec :

```bash
make watch
```

* Pour lancer l’application en cours de développement, utilisez :

```bash
make debug
```

Cela permettra de lancer l’application en mode `DEBUG`, qui indiquera des messages d’erreurs complets dans le navigateur lorsqu’ils se produisent.

En mode de développement, la base de données doit être exécutée localement et doit être accessible par `localhost:27017`.

Pour produire certaines données en vue de l’affichage par l’application Flask, suivez les instructions dans le [tracker](https://github.com/cds-snc/tracker).

## Domaine public

Ce projet fait partie du [domaine public](LICENSE.md#---------------------------------------------------------------------) mondial. Comme l’indique le fil [CONTRIBUTING](CONTRIBUTING.md#---------------------------------------------------------------------) :

> Le projet fait partie du domaine public; l’auteur renonce dans le mode entier au droit d’auteur et aux droits connexes sur l’œuvre par voie de la licence [CC0 1.0 Universel – Transfert dans le domaine public](https://creativecommons.org/publicdomain/zero/1.0/deed.fr).
>
> Toutes les contributions à ce projet seront publiées en application de la licence CC0. En présentant une demande de retrait, vous acceptez de vous conformer à la présente renonciation au droit d’auteur.

### Origine

À l’origine, ce projet a été créé à partir du fil [18F](https://github.com/18f/pulse) et a été modifié pour s’adapter au contexte canadien.
