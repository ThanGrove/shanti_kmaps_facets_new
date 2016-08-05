(function ($) {
    Drupal.behaviorsshanti_kmaps_facets = {
        attach: function (context, settings) {
            var admin = settings.shanti_kmaps_admin;
            if (context == document) {
                $('.kmapfacettree').each(function() {
                    $tree = $(this);
                    var domain = $tree.data('kmtype');
                    var root_kmap_path = domain == 'subjects' ? admin.shanti_kmaps_admin_root_subjects_path : admin.shanti_kmaps_admin_root_places_path;
                    var base_url = domain == 'subjects' ? admin.shanti_kmaps_admin_server_subjects : admin.shanti_kmaps_admin_server_places;

                    var tree = $tree.kmapsTree({
                        termindex_root: admin.shanti_kmaps_admin_server_solr_terms,
                        kmindex_root: admin.shanti_kmaps_admin_server_solr,
                        type: domain,
                        root_kmap_path: root_kmap_path,
                        baseUrl: base_url,
                        generateIds: false,
                        resource_types: settingsshanti_kmaps_facets.resource_types,
                        showCounts: settingsshanti_kmaps_facets.show_counts,
                        hideUnusedTerms: settingsshanti_kmaps_facets.hide_zeros,
                        hbtemplate: settingsshanti_kmaps_facets.hbtemplate,
                    });
                });
                
                $('.kmapfacettree').each(function() { 
                    $(this).css("height", "auto"); 
                    $(this).on('fancytreeactivate', function(e, item) {
                        var title = item.node.title;
                        var data = item.node.data;
                        //console.log(data);
                        if (typeof(data.kmapid) == "undefined" || data.kmapid.indexOf('-') == -1) {
                            console.warn("Improper KMap ID for item clicked (" + title + ")");
                            return;
                        }
                        var kmdata = data.kmapid.split("-");
                        var url = Drupal.settingsshanti_kmaps_facets.link_syntax.replace('__DOMAIN__', kmdata[0]).replace('__ID__', kmdata[1]);
                        if (Drupal.settingsshanti_kmaps_facets.use_ajax) {
                            $('#block-system-main .content').html('<div>Loading ...</div>');
                            $('#block-system-main .content').load(url, function() {
                                // On success change the page title
                                $('span.page-title-text').text(Drupal.t('Results for') + " " + title);
                            });
                        }
                    });
                });
            }
        }
    };
})(jQuery);