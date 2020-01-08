# Updating Packages

This project includes several scripts/packages that should be updated manually when new versions come out. 

* [jQuery](https://jquery.com/): `static/js/vendor/jquery-3.2.1.min.js.js`
* [D3](https://d3js.org/): `static/js/vendor/d3.min.js`
* [Datables](https://datatables.net/):  `static/DataTables-1.10.12`

You can update these by downloading a newer version of a script and replacing the old version in the project with the new one. If the name of the .js file changes, be sure to update the include in `templates/includes/head`.