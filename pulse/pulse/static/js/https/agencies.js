$(document).ready(function () {

  $.get("/data/agencies/https.json", function(data) {
    Tables.initAgency(data.data, {

      csv: "/data/hosts/https.csv",

      columns: [
        {
          className: 'control',
          orderable: false,
          data: "",
          render: Tables.noop,
          visible: false
        },
        {
          data: "name",
          cellType: "td",
          render: eligibleHttps,
          createdCell: function (td) {td.scope = "row";}
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
          data: "preloading.preloaded",
          render: Tables.percent("preloading", "preloaded")
        },
      ]

    });
  });

  var eligibleHttps = function(data, type, row) {
    var services = row.https.eligible;
    var domains = row.total_domains;
    var name = row.name;
    var services_text = "service";
    if (type == "sort") return name;

    if(services > 1) 
      services_text = "services"

    var link = function(text) {
      return "" +
        "<a href=\"/en/domains/#" +
          QueryString.stringify({q: row["name"]}) + "\">" +
           text +
        "</a>";
    }

    return "<div class=\"mb-2\">" + name + "</div>" + link("Show " + services + " " + services_text);

  };


});
