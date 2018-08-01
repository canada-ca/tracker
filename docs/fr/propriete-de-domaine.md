# Propriété de domaine

Le présent document explique comment les domaines sont décrits à l’organisme qui les détient après le processus d’analyse.


## Description des données

Il y a deux sources de données en cause dans la détermination de la propriété, `domains.csv` et `owners.csv`.

`domains.csv` est tout simplement la liste des domaines à analyser. Aucun concept de propriété ou d’organisme n’est impliqué dans ces données.  
`owners.csv` est une liste de domaines portant le nom de l’organisme qui les détient. Celle-ci permet de déterminer le propriétaire de chaque domaine dans `domains.csv`

**NOTE**:Même s’il semble que la liste `owners.csv` est redondante et que les renseignements pourraient simplement se trouver dans une source de données (mettez simplement les organismes avec les domaines dans `domains.csv`), il y a en fait une raison pour les différencier dans deux listes distinctes. Ce sera précisé d’ici la fin du présent document.

## L’algorithme

Pendant l’étape de traitement des résultats de l’analyse, les domaines sont liés à leurs propriétaires. Cela se fait au moyen du processus suivant.
Prenez le jeu de données suivant :

`domains.csv`

| domain                       |
| ---------------------------- |
| canada.ca                    |
| consultations-edsc.canada.ca |
| digital.canada.ca            |
| 2006census.gc.ca             |

`owners.csv`

| domain            | organization_name_en                     | organization_name_fr                         |
| ----------------- | ---------------------------------------- | -------------------------------------------- |
| canada.ca         | Employment and Social Development Canada | Famille, Enfants et Développement social     |
| digital.canada.ca | Treasury Board of Canada Secretariat     | Secrétariat du Conseil du Trésor du Canada   |

Pour lier les domaines à leurs propriétaires, les mesures suivantes sont prises :
pour chaque domaine dans la liste de domaines :

1. vérifiez son existence dans la liste du propriétaire, s’il est présent, prenez les renseignements de l’organisme et arrêtez le traitement approfondi pour ce domaine;
2. divisez le domaine en morceaux en fonction du caractère `.`;
3. enlevez le premier morceau et joignez les morceaux restants avec les caractères  `.`;
4. retournez à l’étape  `1`;
5. si tous les morceaux sont retirés jusqu’à ce qu’il n’en reste aucun, et qu’on ne trouve toujours aucune correspondance dans la liste des propriétaires, établissez la valeur par défaut à l’organisme « Gouvernement du Canada ».

Pour le jeu de données ci-dessus, on obtiendra le résultat suivant :

| domain                       | organization_name_en                     | organization_name_fr                         |
| ---------------------------- | ---------------------------------------- | -------------------------------------------- |
| canada.ca                    | Employment and Social Development Canada | Famille, Enfants et Développement social     |
| consultations-edsc.canada.ca | Employment and Social Development Canada | Famille, Enfants et Développement social     |
| digital.canada.ca            | Treasury Board of Canada Secretariat     | Secrétariat du Conseil du Trésor du Canada   |
| 2006census.gc.ca             | Government of Canada                     | Gouvernement du Canada                       |

* `canada.ca` - était dans la liste des propriétaires, a donc immédiatement recueilli les renseignements de l’organisme dans son entrée
* `consultations-edsc.canada.ca`
    1. `consultations-edsc.canada.ca` n’était pas présent
    2. `canada.ca` était présent, alors prenez ses renseignements sur l’organisme
* `digital.canada.ca` - était dans la liste des propriétaires, a donc immédiatement recueilli les renseignements de l’organisme dans son entrée
* `2006census.gc.ca`
    1. `2006census.gc.ca` n’était pas présent
    2. `gc.ca` n’était pas présent
    3. `ca` n’était pas présent
    4. Aucune entrée trouvée établit la valeur par défaut à l’organisme `Government of Canada`

Le principal avantage de cela, en plus de simplement comprendre les renseignements sur l’organisme avec les domaines dans une grande liste, est que l’on peut ajouter les nouveaux sous-domaines sans se soucier du propriétaire.
Si le domaine est un sous-domaine d’un domaine suivi existant, il recueillera les renseignements automatiquement.
