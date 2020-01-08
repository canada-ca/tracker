# Making Additions

This document is meant to give an explanation of the location of various components of the system, and how one would change or add to them.

The dashboard is a [Flask](http://flask.pocoo.org/) application, meaning that it uses python for page routing, data retrieval, and to render [Jinja2](http://jinja.pocoo.org/docs/latest/) templates into HTML that is then served to the user. The resulting HTML pages use JavaScript to request and display the data and handle interactions with the pages.

## Frontend Content

The frontend content is located within the `track` subdirectory, in the `templates` and `static` directories.
* `static` - for static content such as JavaScript, CSS, images, etc.
* `templates` - for the Jinja2 templates

If you need to make an addition or edit to the frontend content, it will likely be isolated to one or both of these folders.  
To make an edit to the copy, simply find where it is in the `templates` directory, and make the edit (remembering to do so in both languages).
To make an edit to the page behavior or style, it is likely that an edit will need to be made to some of the static files.

### Adding new pages

New pages can be added by creating a new page in `templates/en` and `templates/fr`. A fresh, basic page layout will look like this:

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

where: 

* `{% extends "en/layout-en.html" %}` sets the page to inherit all the content from the base layout (in the case of a French page, it'll extend `fr/layout-fr.html`)
* `{% block title %}` contains the title of the page that will be put in the `title` tag
* `{% block pageid_en %} / {% block pageid_fr %}` contains the id of the page. It is **very** important that this matches the route name assigned to the page in `views.py`, because this is how the language switcher determines the URL of the opposite language page
* `{% block description %}` contains the content that will go into the description meta tag
* `{% block content %}` contains all the content for the page. Make sure to keep the section tag 

Once a new page is added, you will need to create a new route for it in `views.py`, and add it to the navigation in `templates/en/layout-en.html` and `templates/fr/layout-fr.html`.

### Header / Footer

If you need to modify the header or footer, they can be found in `templates/includes`.

### Styles

This project includes a precompiled [Tailwind CSS](https://tailwindcss.com/docs/what-is-tailwind/) file in `static/css/cds.min.css`. Tailwind is a utility-first CSS framework for rapidly building custom user interfaces. Any utility classes listed in their documentation can be used in this project, and you will see them throughout the markup. For example, a link definition may look like this:

`<a class="text-xl text-https-blue hover:text-black font-bold" href="/en/guidance/">`

`text-xl`, `text-https-blue`, `hover:text-black`, and `font-bold` are all Tailwind classes that build up the resulting look & behavior of the link. To keep new content in sync with current content, we recommend looking at the current styles and copying them as needed.

If you need to write any custom classes, `static/scss/` includes several scss files that can be modified to create custom styles. When making changes to .scss files, make sure to be running the `make watch` command, which will watch the scss files for updates and compile them automatically to the `static/css/main.css` file for you.

Most notably, `datatables.scss` contains almost all the styling for the datatables.

### Donut charts

The donut charts in this project are powered by [D3](https://d3js.org/), a JavaScript library for manipulating documents based on data. The script is contained in `templates/includes/donut.html`. To change the data displayed by the chart or create new charts displaying different data, you need to modify the line that calculates the percent:

`var compliant = Math.round((data.compliant / data.eligible) * 100);`, where you would swap data.compliant to the field from the data that you want to display. 

D3 works by selecting a `div` with a specific `class` and using it to render the chart. 

`var chart = d3.select('.compliant');`

If you're adding multiple charts to a page, you'll need to make sure that each chart has a unique `class` that D3 can select.

### Datatables

The datatables in this project are powered by [DataTables](https://datatables.net/), a jQuery JavaScript library to add advanced features to HTML tables. It is what powers the data display, searching, etc. The key scripts related to DataTables are:

* `static/js/https/domains.js`: generates the domains view datatable 
* `static/js/https/organizations.js`: generates the organizations view datatable
* `static/js/tables.js`: handles general table functions like initialization, percent calculation for bars, syncing URL to search, etc.
* `static/js/utils.js`: general table utilities 
* `static/js/dataTables.downloads.js`: generates the CSV download links

For the most part, you should only need to touch domains.js and organizations.js. These are the scripts you'll go to change text, add new columns, etc. When adding a new column, you'll also need to add it to the page template (`templates/domains.html` & `templates/organizations.html`).

## Routing, page rending, and data retrieval

To make a change to the backend of the dashboard, the `.py` files in `track` contain what you need.  
* `__init__.py` - function for creating and initializing the flask application
* `data.py` - mappings from database document property names to human readable names for the CSV export and frontend
* `helpers.py` - small number of helper functions for the template rendering
* `models.py` - abstraction layer on top of the database. Application makes calls into this module to interact with the database
* `views.py` - route definitions. Code that will be executing when users attempt to visit paths (such as `/en/domains/`, which displays the English domains page)
* `wsgi.py` - simple module that just creates and holds a reference to the Flask app
