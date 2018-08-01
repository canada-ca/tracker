## Using lambda scanners

Le module [domain-scan](https://github.com/cds-snc/domain-scan) est capable d’effectuer une importante analyse en parallèle à l’aide de Lambda AWS. Le répertoire domain-scan a [ses propres documents](https://github.com/cds-snc/domain-scan/blob/master/docs/lambda.md) sur le sujet que nous vous encourageons à lire, mais voici quelques notions de base pour vous permettre de commencer. .


### Élaboration
Afin de déployer les fonctions dans Lambda, il faut d’aborder élaborer un **environnement** (dépendances compilées et emballées). Techniquement, on peut effectuer cela dans tout ordinateur, mais il est très probable que lorsqu’en fait on essaye, les paquets ne fonctionnent pas dans Lambda, puisque certaines dépendances sont compilées de façon particulière pour diverses plateformes.

Pour contourner cela, on élabore les environnements dans un conteneur Docker qui est très semblable à l’environnement d’exécution de Lambda. Le répertoire  [dhs-ncats/lambda_functions](https://github.com/dhs-ncats/lambda_functions) est exclusivement créé à cette fin. Leur répertoire contient les instructions sur l’utilisation, au besoin.

```bash
git clone https://github.com/dhs-ncats/lambda_functions.git
cd lambda_functions
docker-compose build
docker-compose up
```

Cela créera trois fichiers `.zip`, dont nous utiliserons `pshtt.zip` et `sslyze.zip`.

Une fois ces fichiers ZIP créés, copiez-les dans le sous-répertoire `lambda/envs` de `domain-scan`.


### Configuration d’AWS
Il y a deux éléments requis d’AWS avant de pouvoir déployer et utiliser les scanneurs.

1. 1.	Il faut créer un rôle de gestion des identités et de l’accès (GIA) doté de la stratégie `AWSLambdaFullAccess`.
2. 2.	Il faut créer et extraire des justificatifs d’identité pour un utilisateur ayant accès à Lambda.

Nous proposons la création d’un nouvel utilisateur de la GIA pour les justificatifs d’identité API qui a un accès limité à ce qui est nécessaire. Une fois que l’utilisateur est créé, créez un ensemble de clés d’accès dans l’onglet `Security Credentials` du sommaire de l’utilisateur de la GIA. Assurez-vous de stocker la clé secrète quelque part, puisqu’il est impossible de la récupérer après la création de la paire de clés.

Après la récupération des justificatifs d’identité, veuillez également noter l’ARN du nouveau rôle que vous avez créé, puisque vous en aurez besoin dans la prochaine section également.



### Déploiement
Une fois les environnements créés, et AWS préparé, nous pouvons effectivement déployer les scanneurs. Il y a un script dans le référentiel `domain-scan` prêt à le faire, il exige seulement est une petite configuration.

1. Installez la trousse `awscli` de Python (de préférence dans un environnement virtuel)
```bash
python -m venv .env
. .env/bin/activate
pip install awscli
```
2. Configurez le client avec les justificatifs d’identité API pour un utilisateur d’AWS ayant l’autorisation de modifier Lambda
```bash
$ aws configure --profile lambda
AWS Access Key ID [None]: **ACCESS-ID-HERE**
AWS Secret Access Key [None]: **SECRET-ACCESS-KEY**
Default region name [None]: ca-central-1
Default output format [None]: json
```
3. Établissez la variable de l’environnement `AWS_LAMBDA_ROLE` à l’ARN du rôle que nous avons créé avec la stratégie `AWSLambdaFullAccess`
```bash
export AWS_LAMBDA_ROLE=**ARN**
```
4. 4.	Déployez les scanners
```bash
./lambda/deploy.sh pshtt --create
./lambda/deploy.sh pshtt --create
```

**REMARQUE** : Si vous mettez à jour les scanneurs déployés au lieu de les créer à partir de rien, supprimez l’option `--create` dans les commandes ci-dessus.

### Utilisation
Pour utiliser les scanneurs Lambda, il faut simplement ajouter `--lambda`  à la fin des commandes `tracker run` ou `tracker update`. Cela exige que le client AWS soit déjà configuré (ce qui crée des fichiers de configuration simples dans le répertoire $HOME).
En plus de cet indicateur, vous pouvez exécuter `--lambda-profile PROFILE_NAME` pour utiliser un profil nommé. Cela suppose également que le profil indiqué a été configuré localement.

La configuration peut se faire de façon interactive à l’aide de la commande `aws configuration` comme on l’a fait précédemment, ou en rédigeant un fichier de configuration manuellement. (Vous trouverez un exemple de ce cas dans le [répertoire de déploiement tracker](../tracker/deploy/scan.sh))

En supposant que votre environnement est configuré, et que vous avez des données à analyser (voir le  [Guide de déploiement local](directives-locales.md) pour vous préparer, le cas échéant), exécutez une analyse à l’aide des fonctions Lambda.
```bash
tracker run --lambda --lambda-prile lambda
```
