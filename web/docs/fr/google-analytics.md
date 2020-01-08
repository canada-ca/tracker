# Google Analytics

Ce projet comprend un compte Google Analytics configuré avec des événements personnalisés pour les téléchargements de fichiers CSV et des clics sur les liens de l’organisme, pour suivre les données que les utilisateurs examinent ou recherchent. Pour utiliser Google Analytics, vous devrez créer votre propre compte Google Analytics et brancher votre nouvel ID de suivi dans la fonction `gtag('config')` dans `templates/includes/head.html`. Tout le reste devrait fonctionner automatiquement.

Deux événements personnalisés sont inclus pour suivre la manière dont les utilisateurs interagissent avec le produit. Vous trouverez ces événements personnalisés sous l’onglet `Comportement > Événements` tab.

## Téléchargement de fichiers CSV

Il y a deux événements pour les téléchargements de fichiers CSV : CSV complet et CSV de domaine précis. Ils sont classés dans la catégorie d’événement  « Download / Télécharger ». En cliquant sur « Action d’événement », vous pouvez voir les fichiers CSV précis que les utilisateurs téléchargent.

## Filtrage par organisme

Il y a un événement pour la recherche ou le filtrage, qui est déclenché lorsqu’un utilisateur clique sur un lien « Afficher des domaines » sur la vue d’organisme du tableau de bord. Il fait le suivi des organismes qui intéressent le plus les utilisateurs, et ils sont classés dans la catégorie d’événements `Search/Rechercher`. En cliquant sur « Action d'événement », vous pouvez voir les organismes précis que les utilisateurs recherchent. Veuillez noter que cela ne fait pas le suivi des recherches que les utilisateurs ont manuellement saisies dans la barre de recherche.
