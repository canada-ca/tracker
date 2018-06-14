$(document).ready(function () {

  $.get("/data/organizations/https.json", function(data) {

    Tables.initAgency(data.data, {

      csv: "/data/hosts/https.csv",

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
          data: "name_" + language,
          cellType: "td",
          render: eligibleHttps,
          createdCell: function (td) {td.scope = "row";}
        },
        {
          data: "https.compliant",
          render: Tables.percent("https", "compliant")
        },
        {
          data: "https.enforces",
          render: Tables.percent("https", "enforces")
        },
        {
          data: "https.hsts",
          render: Tables.percent("https", "hsts")
        },
        {
          data: "crypto.bod_crypto",
          render: Tables.percent("crypto", "bod_crypto")
        },
        {
          data: "crypto.good_cert",
          render: Tables.percent("crypto", "good_cert")
        },
      ]

    });
  });

  //get table language
  var language = $( "table" ).attr("language");

  var text = {
    show: {
      en: "Show",
      fr: "Montrer"
    },

    domains: {
      en: "domains",
      fr: "domaines"
    },

    domain_singular: {
      en: "domain",
      fr: "domaine"
    }
  };

  var eligibleHttps = function(data, type, row) {
    var services = row.https.eligible;
    var domains = row.total_domains;

    if(language == 'en')
      var name = row.name_en;
    else
      var name = row.name_fr;

    if (type == "sort") return name;

    var link = function(link_text) {
      return "" +
        "<a href=\"/" + language + "/" + text.domains[language] + "/#" +
          QueryString.stringify({q: row["name_" + language]}) + "\">" +
           link_text +
        "</a>";
    }

    if(services > 1)
      return "<div class=\"mb-2\">" + name + "</div>" + link(text.show[language] + " " + services + " " + text.domains[language]);
    else
      return "<div class=\"mb-2\">" + name + "</div>" + link(text.show[language] + " " + services + " " + text.domain_singular[language]);
  };


});
