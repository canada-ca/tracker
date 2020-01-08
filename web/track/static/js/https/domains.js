$(function () {

  // referenced in a few places
  var table;

  // Populate with parent domain data, expand hosts per-domain
  $.get("/data/domains/https.json", function(data) {
    table = Tables.init(data.data, {

      csv: "/data/hosts/" + language + "/compliance.csv",

      responsive: {
          details: {
              type: "column",
              display: $.fn.dataTable.Responsive.display.childRow
          }
      },

      initComplete: initExpansions,

      prefix: language,

      columns: [
        {
          className: 'control',
          orderable: false,
          data: "",
          render: Tables.noop,
          visible: false
        },
        {
          data: "domain",
          width: "240px",
          cellType: "th",
          render: showDomain,

          createdCell: function (td) {
            td.scope = "row";
          }
        },
        {data: "organization_name_" + language}, // here for filtering/sorting
        {
          data: "totals.https.compliant",
          type: "numeric",
          render: Tables.percentTotals("https", "compliant")
        },
        {
          data: "totals.https.enforces",
          type: "numeric",
          render: Tables.percentTotals("https", "enforces")
        },
        {
          data: "totals.https.hsts",
          type: "numeric",
          render: Tables.percentTotals("https", "hsts")
        },
        {
          data: "totals.crypto.bod_crypto",
          type: "numeric",
          render: Tables.percentTotals("crypto", "bod_crypto")
        },
        {
          data: "totals.crypto.good_cert",
          type: "numeric",
          render: Tables.percentTotals("crypto", "good_cert")
        },
        {
          data: "",
          render: Tables.noop
        }
      ]
    });
  });

  //get table language
  var language = $( "table" ).attr("language");

  /**
  * I don't like this at all, but to keep the presentation synced
  * between the front-end table, and the CSV we generate, this is
  * getting replicated to the /data/update script in this repository,
  * and needs to be manually synced.
  *
  * The refactor that takes away from DataTables should also prioritize
  * a cleaner way to DRY (don't repeat yourself) this mess up.
  */

  // todo: add french names

  var text = {

    show: {
      en: "Show",
      fr: "Montrer les"
    },

    hide: {
      en: "Hide",
      fr: "Cacher les"
    },

    details: {
      en: "details",
      fr: "détails"
    },

    preloaded: {
      en: "No, uses",
      fr: "Non, utilise"
    },

    link_1: {
      en: "Showing data for ",
      fr: "Afficher les données pour "
    },

    link_2: {
      en: " service(s) within ",
      fr: " service(s) dans "
    },

    link_3: {
      en: "Download CSV",
      fr: "Télécharger CSV"
    },

    fetch: {
      en: "Fetching data for ",
      fr: "Récupération des données de "
    },

    loading: {
      en: "Loading ",
      fr: "Téléchargement des "
    },

    error: {
      en: "Error loading data for ",
      fr: "Erreur dans le téléchargement des données de "
    },

    subdomains: {
      en: " subdomains",
      fr: " sous-domaines"
    },

    subdomain: {
      en: " subdomain",
      fr: " sous-domaine"
    },

  };

  var names = {

    compliant: {
      en: {
        "-1": "<strong>No</strong>",
        0: "<strong>No</strong>",
        1: "Yes",
      },
      fr: {
        "-1": "<strong>Non</strong>",
        0: "<strong>Non</strong>",
        1: "Oui",
      }
    },

    enforces: {
      en: {
        0: "<strong>No</strong>", // No (no HTTPS)
        1: "<strong>No</strong>", // Present, not default
        2: "Yes", // Defaults eventually to HTTPS
        3: "Yes" // Defaults eventually + redirects immediately
      },
      fr: {
        0: "<strong>Non</strong>", 
        1: "<strong>Non</strong>", 
        2: "Oui", 
        3: "Oui" 
      },
    },

    hsts: {
      en: {
        "-1": "<strong>No</strong>", // No (no HTTPS)
        0: "<strong>No</strong>",  // No
        1: "<strong>No</strong>", // No, HSTS with short max-age (for canonical endpoint)
        2: "Yes", // Yes, HSTS for >= 1 year (for canonical endpoint)
        3: "Preloaded" // Yes, via preloading (subdomains only)
      },
      fr: {
        "-1": "<strong>Non</strong>", 
        0: "<strong>Non</strong>",
        1: "<strong>Non</strong>",
        2: "Oui",
        3: "Préchargé"
      }
    },

    bod_crypto: {
      en: {
        "-1": "N/A", // No HTTPS
        0: "<strong>No</strong>, download CSV for details",
        1: "Yes"
      },
      fr: {
        "-1": "S.&nbsp;O.",
        0: "<strong>Non</strong>, télécharger le fichier CSV pour plus de détails",
        1: "Oui"
      }
    },

    good_cert: {
      en: {
        "-1": "N/A",
        0: "<strong>No</strong>, download CSV for details",
        1: "Yes",
      },
      fr: {
        "-1": "S.&nbsp;O.",
        0: "<strong>Non</strong>, télécharger le fichier CSV pour plus de détails",
        1: "Oui",
      }
    }
  };

  var display = function(set) {
    return function(data, type, row) {
      if (type == "sort")
        return data.toString();
      else
        return set[data.toString()];
    }
  };

  var loadHostData = function(tr, base_domain, hosts) {
    var all = [];
    var number = hosts.length;

    var csv = "/data/hosts/" + base_domain + "/" + language + "/compliance.csv";

    for (i=0; i<hosts.length; i++) {
      var host = hosts[i];
      var details = $("<tr/>").addClass("host");

      var link = "<a class=\"word-break text-2xl\" href=\"" + host.canonical + "\" target=\"blank\">" + Utils.truncate(host.domain, 35) + "</a></div>";
      details.append($("<td/>").addClass("link").html(link));

      var compliant = names.compliant[language][host.https.compliant];
      details.append($("<td class=\"compliant\"/>").html(compliant));

      var https = names.enforces[language][host.https.enforces];
      details.append($("<td/>").html(https));

      var hsts = names.hsts[language][host.https.hsts];
      details.append($("<td/>").html(hsts));

      var crypto = names.bod_crypto[language][host.https.bod_crypto];
      details.append($("<td/>").html(crypto));

      var good_cert = names.good_cert[language][host.https.good_cert];
      details.append($("<td/>").html(good_cert));

      // blank
      details.append($("<td/>"));

      all.push(details);
    }

    var link = text.link_1[language] + number + text.link_2[language] + base_domain;
    link += l(base_domain, csv, text.link_3[language], "class=\"float-right mr-4\"");

    var download = $("<tr></tr>").addClass("subdomain").html("<td class=\"link bg-https-light-gray\" colspan=6><strong>" + link + "</strong></td>");
    all.push(download);

    tr.child(all, "child");
  };

  var loneDomain = function(row) {
    return (row.is_parent && row.totals.https.eligible == 1 && row.https.eligible);
  };

  var showDomain = function(data, type, row) {
    if (type == "sort") return row.domain;

    // determines whether remote fetching has to happen
    var fetch = !(loneDomain(row));

    return n(row.domain) + "<div class=\"mt-0 text-2xl\">" + l("", "#", showHideText(true, row), "data-fetch=\"" + fetch + "\" data-domain=\"" + row.domain + "\"") + "</div>";
  };

  var showHideText = function(show, row) {
    if (loneDomain(row))
      return (show ? "<img alt='' src=\"/static/images/arrow.png\" aria-hidden=\"true\" class=\"rotated pb-1 mr-1 h-2\">" + text.show[language] : "<img alt='' src=\"/static/images/arrow.png\" class=\"mr-2 h-2\">" + text.hide[language]) + " " + text.details[language];
    else if(row.totals.https.eligible == 1)
      return (show ? "<img alt='' src=\"/static/images/arrow.png\" aria-hidden=\"true\" class=\"rotated pb-1 mr-1 h-2\">" + {en: "Show", fr: "Montrer le"}[language] : "<img alt='' src=\"/static/images/arrow.png\" class=\"mr-2 h-2\">" + {en: "Hide", fr: "Cacher le"}[language]) + " " + {en: "1", fr:""}[language] + text.subdomain[language];
    else
      return (show ? "<img alt='' src=\"/static/images/arrow.png\" aria-hidden=\"true\" class=\"rotated pb-1 mr-1 h-2\">" + text.show[language] : "<img  alt=''src=\"/static/images/arrow.png\" class=\"mr-2 h-2\">" + text.hide[language]) + " " + row.totals.https.eligible + text.subdomains[language];
  };

  var initExpansions = function() {
    $('table.domain').on('click', 'tbody tr.odd, tbody tr.even', function() {
      var row = table.row(this);

      // zero in on the parent row, whichever was clicked
      if (row.data() == undefined)
        row = table.row(this.previousElementSibling);
      if (row.data() == undefined) return;

      var data = row.data();
      var was_expanded = data.expanded;
      var base_domain = data.base_domain;

      if (!was_expanded) {
        data.expanded = true;

        // link's data-fetch will tell us whether data has to be fetched
        var link = $("a[data-domain='" + base_domain + "']");
        var fetch = link.data("fetch");

        if (fetch) {
          console.log(text.fetch[language] + base_domain + "...");
          link.addClass("loading").html("<img alt='' src=\"/static/images/arrow.png\" aria-hidden=\"true\" class=\"mr-2 h-2\">" + text.loading[language] + base_domain + " services...");

          $.ajax({
            url: "/data/hosts/" + base_domain + "/https.json",
            success: function(response) {
              loadHostData(row, base_domain, response.data);

              // show the data right away
              row.child.show()

              // set it to just show/hide from now on without fetching
              link.data("fetch", false);

              // disable loading styles
              link.removeClass("loading");

              // show the "hide" text
              link.html(showHideText(false, data));
            },
            error: function() {
              console.log(text.error[language] + base_domain);
            }
          });
        } else {
          // if it's a lone domain, just refill the data every time
          // instead of making this function's logic even more elaborate
          if (loneDomain(data))
            loadHostData(row, base_domain, [data]);

          // show the "hide" text
          link.html(showHideText(false, data));

          row.child.show();
        }

      }

      else { // was_expanded == true
        data.expanded = false;
        row.child.hide();
        $("a[data-domain='" + base_domain + "']").html(showHideText(true, data));
      }

      return false;
    });
  };

  var l = function(base_domain, href, text, extra) {

    return "<a href=\"" + href + "\" target=\"blank\" " + extra + ">" + text + "</a>";
  };

  var n = function(text) {
    return "<div class=\"word-break text-2xl leading-tight\"><strong>" + text + "</strong></div>";
  }

})
