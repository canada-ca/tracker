[![CircleCI](https://circleci.com/gh/cds-snc/tracker.svg?style=svg)](https://circleci.com/gh/cds-snc/tracker)
[![Known Vulnerabilities](https://snyk.io/test/github/cds-snc/tracker/badge.svg)](https://snyk.io/test/github/cds-snc/tracker)

[La version française suit.](#---------------------------------------------------------------------)

## Track Government of Canada domains's adherance to digital security practices

How the GC domain space is doing at best practices and federal requirements.

| Documentation                                           |
| ------------------------------------------------------- |
| [Development Setup Instructions](#development-setup)    |
| [Local Deploy Step-by-step](docs/local-instructions.md) |

## Developer Notes

This repository is using [snyk](https://snyk.io/org/cds-snc) to scan our dependencies for vulnerabilities.  
Unfortunately Synk lacks the ability to detect the dependencies listed in the `setup.py` file.
To get around this we are have the dependencies synced between the `setup.py` and `requirements.txt` (which snyk can scan) files.  
If you are developing this and add an additional dependency, make sure to add it to both locations.

## Development Setup

For development purposes it is recommended that you install [MongoDB](https://www.mongodb.com/) and run the database locally.

This utility is written for **Python 3.6 and up**. We recommend [pyenv](https://github.com/yyuu/pyenv) for easy Python version management.

To setup local Python dependencies you can run `make setup` from the root of the repository. We recommend that this is done from within a virtual environment

* Install dependencies:

```bash
pip install -r requirements.txt
```

* If developing tracker, you will also need the development requirements
```bash
pip install .[development]
```

#### Install domain-scan and dependencies

Download and set up `domain-scan` [from GitHub](https://github.com/cds-snc/domain-scan) as per it's setup instructions.

`domain-scan` in turn requires [`pshtt`](https://github.com/dhs-ncats/pshtt) and [`sslyze`](https://github.com/nabla-c0d3/sslyze). These can be installed directly via `pip`.

The app requires you to set one environment variable:

* `DOMAIN_SCAN_PATH`: A path to `domain-scan`'s `scan` binary.
* `DOMAIN_GATHER_PATH`: A path to `domain-scan`'s `gather` binary.

However, if you don't have `pshtt` and `sslyze` on your PATH, then `domain-scan` may need you to set a couple others:

* `PSHTT_PATH`: Path to the `pshtt` binary.
* `SSLYZE_PATH`: Path to the `sslyze` binary.

#### Then run it

```
tracker run
```

This will kick off the `domain-scan` scanning process for HTTP/HTTPS and DAP participation, using the domain lists as specified in `data/data_meta.yml` for the base set of domains to scan.

Then it will run the scan data through post-processing producing some JSON and CSV files as scan artifacts and finally uploading the results into the database that the frontend uses to render the information (by default if not further specified `localhost:21017/track`).

For a more detailed step by step procedure of getting a local development deployment going, checkout out the [Local Deploy Step-by-step](docs/en/local-instructions.md) document!

#### Scanner CLI

The utility has a CLI that can be used to perform individual parts of the scanning in isolation of the other steps.
By following the steps to setup the Scanning portion, this CLI should be readily accessible to you (if you have activated the environment you installed it into).
As you may have guessed from the command in the previous section, the CLI command is `tracker`.

Help on how to use the CLI can be output via the command `tracker --help`.


## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.

### Origin

This project was originally forked from [18F](https://github.com/18f/pulse) and has been modified to fit the Canadian context.

## ---------------------------------------------------------------------

## Faire le suivi du respect des pratiques en matière de sécurité Web par les domaines du gouvernement du Canada

La mesure dans laquelle l’espace des noms de domaine du gouvernement du Canada respecte les pratiques exemplaires et les exigences fédérales.

| Documentation                                           |
| ------------------------------------------------------- |
| [Instructions de configuration du développement](#configuration-du-développement)    |
| [Déploiement local étape par étape](docs/fr/directives-locales.md) |

## Developer Notes

Ce dépôt utilise [snyk](https://snyk.io/org/cds-snc) pour analyser nos dépendances à l’égard des vulnérabilités.
Malheureusement, Snyk ne peut pas déceler les dépendances énumérées dans le fichier `setup.py`. Pour contourner ce problème, nous avons synchronisé les dépendances entre les fichiers `setup.py` et `requirements.txt` (que Snyk peut numériser).
Si vous procédez au développement et ajoutez une dépendance supplémentaire, vous devez veiller à l’ajouter aux deux emplacements.

## Configuration du développement

À des fins de développement, il vous est recommandé d’installer [MongoDB](https://www.mongodb.com/) et d’exécuter la base de données localement.

Ce programme utilitaire est écrit pour **Python 3.6 et les versions subséquentes**. Nous recommandons [pyenv](https://github.com/yyuu/pyenv) pour une gestion facile des versions de Python.

Pour configurer les dépendances locales de Python, vous pouvez exécuter `make setup` à partir de la racine du dépôt. Nous recommandons que cela soit fait dans un environnement virtuel.

* Installer les dépendances :

```bash
pip install -r requirements.txt
```

* Si vous développez le `tracker`, vous aurez aussi besoin des exigences de développement.

```bash
pip install .[development]
```

#### Installer « domain-scan » et les dépendances

Téléchargez et configurez  `domain-scan` [de GitHub](https://github.com/cds-snc/domain-scan) aconformément aux instructions de configuration.

`domain-scan` à son tour exige [`pshtt`](https://github.com/dhs-ncats/pshtt) et [`sslyze`](https://github.com/nabla-c0d3/sslyze). Ceux-ci peuvent être installés directement au moyen de `pip`.

L’application vous oblige à établir une variable d’environnement :

* `DOMAIN_SCAN_PATH`: Un chemin d’accès vers le fichier binaire `scan` de `domain-scan`.
* `DOMAIN_GATHER_PATH`: Un chemin d’accès vers le fichier binaire `gather` de `domain-scan`.

Cependant, si vous n’avez pas `pshtt` et `sslyze` dans votre CHEMIN D’ACCÈS, then `domain-scan` pourrait exiger que vous en établissiez deux autres :

* `PSHTT_PATH`: Chemin d’accès vers le fichier binaire `pshtt`.
* `SSLYZE_PATH`: Chemin d’accès vers le fichier binaire `sslyze`.

#### Ensuite, exécutez-le

```
tracker run
```

Le processus d’analyse de` domain-scan` pour la participation à HTTP/HTTPS et à DAP sera lancé au moyen des listes de domaines précisés dans `data/data_meta.yml` pour l’ensemble de base des domaines à analyser.

Ensuite, les données seront analysées par posttraitement, ce qui produira quelques fichiers JSON et CSV sous forme d’artefacts d’analyse, puis les résultats seront téléchargés dans la base de données dont se servent les utilisateurs pour fournir des renseignements (par défaut, si ce n’est pas davantage specified `localhost:21017/track`).

Pour obtenir une méthode détaillée étape par étape de mise en œuvre du développement local, consultez le document [Déploiement local étape par étape](docs/fr/directives-locales.md).

#### Interface de ligne de commande de l’analyseur

Le programme utilitaire a une interface de ligne de commande qui peut être utilisée pour exécuter des volets individuels de l’analyse indépendamment des autres étapes. En suivant les étapes pour configurer la partie Analyse, vous devriez avoir facilement accès à cette interface de ligne de commande (si vous avez activé l’environnement dans lequel vous l’avez installée). Comme vous l’aurez deviné à partir de la commande dans la section précédente, l’interface de ligne de commande est `tracker`.

Vous pouvez obtenir de l’aide sur la façon d’utiliser l’interface de ligne de commande au moyen de la commande `tracker --help`.


## Domaine public

Ce projet fait partie du [domaine public](LICENSE.md#---------------------------------------------------------------------) mondial. Comme l’indique le fil [CONTRIBUTING](CONTRIBUTING.md#---------------------------------------------------------------------) :

> Le projet fait partie du domaine public; l’auteur renonce dans le mode entier au droit d’auteur et aux droits connexes sur l’œuvre par voie de la licence [CC0 1.0 Universel – Transfert dans le domaine public](https://creativecommons.org/publicdomain/zero/1.0/deed.fr).
>
> Toutes les contributions à ce projet seront publiées en application de la licence CC0. En présentant une demande de retrait, vous acceptez de vous conformer à la présente renonciation au droit d’auteur.

### Origine

À l’origine, ce projet a été créé à partir du fil [18F](https://github.com/18f/pulse) et a été modifié pour s’adapter au contexte canadien.
