# Définition des données

Le présent document expose les données d’entrée et de sortie de la partie d’analyse du système, en expliquant les valeurs et leur signification.

## Définition des données de sortie

### `domains collection` - résultats de l’analyse au niveau des domaines individuels

| Champ             | Définition        |
| ----------------- | ----------------- |
| \_id | Identifiant (ID) unique |
|domain | Domain name |
| base_domain | Parent si le domaine est un sous-domaine, ou le même domaine s’il s’agit d’un parent |
| organization_name_en | Nom de l’organisme en anglais |
| organization_name_fr |  Nom de l’organisme en français |
| organization_slug | organization_name_en avec des espaces ou des caractères spéciaux normalisés ou supprimés |
| sources | liste des domaines d’où provient le domain |
| is_owner | indicateur pour déterminer si le domain est un propriétaire (associé à un point d’arrêt dans l’organisme qui est propriétaire des sous-domaines) |
| is_parent | indicateur pour déterminer si le domain est un parent (aura sa propre entrée dans la page des domaines) |
| exclude | Inutilisé, sera supprimé |
| live | Si le site est accessible (peut s’y connecter) |
| redirect | Si le domain redirige |
| canonical | Le domain ayant l’un des préfixes « http:// », « http://www », « https:// », ou « https://www », selon le comportement de réorientation du domaine |
| https.eligible | Le site est en ligne ou non |
| https.eligible_zone | `True` si le domain est parent qu’il soit en ligne lui-même, ou comprend des sous-domaines en ligne |
| https.uses | Présence du protocole HTTPS  <br>< 1 – Aucun protocole HTTPS<br>1 – A le protocole HTTPS, mais il y un problème dans la chaîne<br>2 – A le protocole HTTPS |
| https.enforces | Application des connexions HTTPS<br>0 – N’applique pas le protocole HTTPS<br>1 – Le protocole HTTPS est présent, mais n’est pas appliqué<br>2 – Le protocole HTTPS est présent, l’accès y est possiblement redirigé<br>3 – Le protocole HTTPS est présent, l’accès y est immédiatement redirigé |
| https.hsts | Présence du protocole HSTS<br>-1 – Aucun protocole HTTPS<br>0 – Aucun protocole HSTS<br>1 – `max age` du protocole HSTS trop court<br>2 – A le protocole HSTS<br>3 – le domaine parent a préalablement téléchargé le protocole HSTS |
| https.compliant | Conformité avec l’Avis de mise en œuvre de la Politique sur la technologie de l’information (AMPTI) |
| https.preloaded | Indicateur pour déterminer si le domaine a préalablement téléchargé le protocole HSTS<br>-1<br>0<br>1<br>2 |
| https.hsts_age | Âge indiqué dans l’en-tête `hsts-max-age` |
| https.bod_crypto | Regroupement de diverses petites vérifications de chiffrement<br>-1 – S.O. (aucun protocole HTTPS)<br>0 – Mauvais chiffrement présent (rc4, 3des, sslv2, sslv3, tlsv1.0, tlsv1.1, signature autre que sha256+)<br>Aucun problème trouvé |
| https.rc4 | Présence de  RC4 |
| https.3des | Présence de  3DES |
| https.sslv2 | Présence de SSLv2 |
| https.sslv3 | Présence de SSLv3 |
| https.tlsv10 | Accepte le protocole TLSv1.0 |
| https.tlsv11 | Accepte le protocole TLSv1.1 |
| https.good_cert | Utilise SHA-256+ pour l’algorithme de signature |
| https.signature_algorithm | L’algorithme de signature qui est utilisé|
| https.accepted_ciphers | Booléen pour déterminer s’il utilise seulement des chiffrements pris en charge |
| https.bad_ciphers | Liste des chiffrements non pris en charge utilisée |
| totals | Cette section est un décompte des mesures dans l’objet blob `https` pour ce domaine et ses sous-domaines |

### `organizations collection` - Nombre total des domaines appartenant à l’organisme

| Champ             | Définition        |
| ----------------- | ----------------- |
| \_id | ID unique |
| name_en | Nom de l’organisme en anglais |
| name_fr | Nom de l’organisme en français |
| slug | organization_name_en avec des espaces ou des caractères spéciaux normalisés ou supprimés. |
| total_domains | Nombre de domaines appartenant à cet organisme |
| https | Cette section est un décompte des mesures liées au protocole HTTPS pour tous les domaines appartenant à cet organisme |
| crypto | Cette section est un décompte des mesures liées au chiffrement (vérifications du certificat TLS) pour tous les domaines appartenant à cet organisme |
| preloading | Cette section est un décompte des mesures liées au téléchargement préalable du protocole HSTS pour tous les domaines appartenant à cet organisme |

### `reports collection` - Nombre total des statistiques provenant de la collection de domaines

| Champ             | Définition        |
| ----------------- | ----------------- |
| \_id | ID unique |
| https | Cette section est un décompte des mesures liées au protocole HTTPS pour tous les domaines qui ont été analysés  |
| crypto | Cette section est un décompte des mesures liées au chiffrement pour tous les domaines qui ont été analysés |
| preloading | Cette section est un décompte des mesures liées au téléchargement préalable du protocole HSTS pour tous les domaines appartenant à cet organisme |
| report_date | Dernière date d’analyse |

----

## Définition des données d’entrée

Ces données doivent être extraites dans des fichiers locaux CSV au moyen de la commande `tracker preprocess` qui sera utilisée avec l’analyse. Ces données d’entrée sont stockées dans la base de données afin de faciliter la mise à jour de la liste des domaines ou la mise à jour des propriétaires de domaine sans devoir redéployer l’application.

Le scanneur installé pour extraire les données au début de l’analyse signifie que pour mettre à jour ce qui est analysé, mettez simplement à jour les données dans la base de données (manuellement ou à l’aide de la commande `tracker update`).


### `owner collection` - Liste des propriétaires de domaine pour le groupe de sous-domaines

| Champ             | Définition        |
| ----------------- | ----------------- |
| \_id | ID unique |
| domain | Domaine |
| organization_en | Nom de l’organisme du propriétaire en anglais |
| organization_fr | Nom de l’organisme du propriétaire en français |

### `domains collection` - données d’entrée à analyser

| Champ             | Définition        |
| ----------------- | ----------------- |
| \_id | ID unique |
| domain | Domaine |

### `ciphers collection` – liste de chiffrements autorisés

| Champ             | Définition        |
| ----------------- | ----------------- |
| \_id | ID unique |
| cipher | Nom du chiffrement|
