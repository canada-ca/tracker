# Google Analytics

This project includes a Google Analytics set up with custom events for CSV downloads and clicking Organization links, to track what data users are looking at/searching for. To make use of Google Analytics, you will have to create your own Google Analytics account and plug your new tracking ID in the `gtag('config')` function in `templates/includes/head.html`. Everything else should work automatically.

Two custom events are included to help track how users are interacting with the product. You can find these custom events under the `Behavior > Events` tab.

## CSV Download

There are two events for CSV downloads: full CSV & specific domain CSV. These are categorized under the "Download / Télécharger" event category. By clicking "Event Action", you can see the specific CSVs the users download.

## Filtering by Organization

There is one event for searching/filtering, which is triggered when a user clicks on a "Show domains" link on the Organization view of the dashboard. It tracks which organizations the users are most interested in, and are categorized under the "Search / Rechercher" event category. By clicking "Event Action", you can see the specific organizations the users are searching for. Please note that this doesn't track users manually inputting searches in the search bar. 
