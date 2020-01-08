# Faire des ajouts

Le présent document a pour but de donner une explication de l’emplacement des diverses composantes du système, et la façon dont on pourrait les modifier ou y effectuer des ajouts.

Le tableau de bord est une application [Flask](http://flask.pocoo.org/), ce qui signifie qu’il utilise Python pour l’acheminement des pages, l’extraction de données, et pour afficher les modèles de  [Jinja2](http://jinja.pocoo.org/docs/latest/) en HTML qui est ensuite servi à l’utilisateur. Les pages HTML résultantes utilisent JavaScript pour demander et afficher les données et traiter des interactions avec les pages.

## Contenu frontal

Le contenu frontal se trouve dans le sous-répertoire de `track`, dans les répertoires `templates` et `static`.
* `static` - pour le contenu statique comme JavaScript, CSS, les images, entre autres
* `templates` - pour les modèles Jinja2

Si vous devez effectuer un ajout ou modifier le contenu frontal, ce sera probablement isolé à un de ces dossiers ou aux deux.
Pour modifier la copie, trouvez tout simplement son emplacement dans le répertoire `templates`, et apportez la modification (souvenez-vous de le faire dans les deux langues officielles). Pour modifier le comportement ou le style de la page, il est probable qu’une modification sera apportée à certains fichiers statiques.

### Ajout de nouvelles pages

Il est possible d’ajouter de nouvelles pages en créant une nouvelle page dans `templates/en` et `templates/fr`. Une nouvelle mise en page de base ressemblera à ceci :

```{% extends "en/layout-en.html" %}
{% block title %} {% endblock %}

{% block pageid_en %} {% endblock %}
{% block pageid_fr %} {% endblock %}
{% block description %} {% endblock description %}

{% block content %}

<section id="main-content" class="flex-1">

	Page content goes here.

</section>
{% endblock %}
```

où :

* `{% extends "en/layout-en.html" %}` établit la page pour hériter de tout le contenu de la mise en page de base (dans le cas d’une page en français, l’extension sera `fr/layout-fr.html`)
* `{% block title %}` contient le titre de la page qui sera mis dans la balise de `title`
* `{% block pageid_en %} / {% block pageid_fr %}` contient l’ID de la page. Il est très **important** que cela correspond au nom d’itinéraire attribué à la page dans `views.py`, puisque le sélectionneur l’utilise pour déterminer l’adresse URL de la page dans l’autre langue
* `{% block description %}` contient le contenu qui sera dans la balise méta de description
* `{% block content %}` contient tout le contenu de la page. Assurez-vous de garder la balise de section

Une fois qu’une nouvelle page est ajoutée, vous devrez créer un nouvel itinéraire pour elle dans `views.py`, et l’ajouter à la navigation dans `templates/en/layout-en.html` et `templates/fr/layout-fr.html`.

### Entête/pied de page

Si vous devez modifier l’en-tête ou le pied de page, ils se trouvent dans `templates/includes`.

### Styles

Ce projet comprend un fichier précompilé [Tailwind CSS](https://tailwindcss.com/docs/what-is-tailwind/) dans `static/css/cds.min.css`. Tailwind est un cadre CSS d’utilitaire d’abord pour élaborer rapidement des interfaces utilisateur personnalisées. On peut utiliser toutes catégories d’utilitaires énumérées dans leurs documents dans le cadre de ce projet, et vous les verrez tout au long du balisage. Par exemple, une définition de lien peut ressembler à ceci :

`<a class="text-xl text-https-blue hover:text-black font-bold" href="/en/guidance/">`

`text-xl`, `text-https-blue`, `hover:text-black`, et `font-bold` sont toutes des catégories de Tailwind qui composent l’aspect et le comportement résultants du lien. Pour garder le nouveau contenu en synchronisation avec le contenu actuel, nous vous recommandons d’examiner les styles actuels et de les copier au besoin.

Si vous devez rédiger des catégories personnalisées, `static/scss/` comprend plusieurs fichiers scss que l’on peut modifier afin de créer des styles personnalisés. Au moment d’apporter des modifications aux fichiers `.scss`, assurez-vous d’exécuter la commande `make watch`, qui surveillera les fichiers scss pour des mises à jour et les compilera automatiquement en fichier `static/css/main.css` pour vous.

Plus particulièrement, le fichier `datatables.scss` scss contient presque tous les styles pour les datatables.

### Donut charts

Les graphiques en anneau dans le cadre de ce projet sont alimentés par [D3](https://d3js.org/), une bibliothèque JavaScript pour traiter des documents en fonction des données. Le script se trouve dans `templates/includes/donut.html`. Pour modifier les données affichées par le graphique ou créer de nouveaux graphiques affichant diverses données, vous devez modifier la ligne qui calcule le pourcentage :

`var compliant = Math.round((data.compliant / data.eligible) * 100);`, où vous échangeriez  `data.compliant` au champ provenant des données que vous voulez afficher.

D3 fonctionne en sélectionnant un `div` ayant une `class` précise et en l’utilisant pour afficher le graphique.

`var chart = d3.select('.compliant');`

Si vous ajoutez plusieurs graphiques dans une page, vous devrez veiller à ce que chaque graphique ait une `class` unique que D3 peut sélectionner.

### Datatables

Les datatables dans ce projet sont alimentées par [DataTables](https://datatables.net/), une bibliothèque jQuery JavaScript pour ajouter des fonctions avancées aux tables HTML. Elles alimentent l’affichage de données, la recherche, entre autres. Voici les principaux scripts liés à DataTables :

* `static/js/https/domains.js` : produit la datatable d’affichage des domaines
* `static/js/https/organizations.js` : produit la datatable d’affichage des organismes
* `static/js/tables.js` : gère les fonctions générales de table comme l’initialisation, le calcul des pourcentages pour les barres, la synchronisation de l’adresse URL à la recherche, entre autres
* `static/js/utils.js` : utilitaires généraux de table
* `static/js/dataTables.downloads.js` : produit des liens de téléchargement de fichiers CSV

Dans la plupart des cas, vous devriez seulement toucher domains.js et organizations.js. Il s’agit des scripts où vous irez pour modifier le texte, ou ajouter des colonnes, entre autres. À l’ajout d’une nouvelle colonne, vous devrez aussi l’ajouter au modèle de page (`templates/domains.html` et `templates/organizations.html`).

## Acheminement, affichage de page, et extraction des données

Pour apporter un changement à l’arrière-plan du tableau de bord, les fichiers `.py` dans `track` contiennent ce dont vous avez besoin.  
* `__init__.py` - fonction pour créer et lancer l’application Flask
* `data.py` - mise en correspondance des noms de propriété de document de la base de données aux noms lisibles par l’utilisateur pour l’exportation en CSV et le contenu frontal
* `helpers.py` - petit nombre de fonctions auxiliaires pour l’affichage du modèle
* `models.py` - couche d’abstraction au-dessus de la base de données. L’application effectue des appels dans ce module pour interagir avec la base de données
* `views.py` - définitions d’itinéraire. Code qui s’exécutera lorsque les utilisateurs tentent de visiter des chemins d’accès (comme `/en/domains/`, qui affiche la page des domaines en anglais)
* `wsgi.py` - module simple qui crée et détient une référence à l’application Flask
